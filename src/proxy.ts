import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginRoute = pathname === "/admin/login";

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute) {
    if (!user) {
      if (!isAdminLoginRoute) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return response;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_platform_admin");
    if (adminError || !isAdmin) {
      if (!isAdminLoginRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return response;
    }

    if (isAdminLoginRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  }

  const isBillingRoute = pathname.startsWith("/billing");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/criar-conta");

  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && (pathname.startsWith("/checkout") || pathname.startsWith("/criar-conta"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && !isAuthRoute && !isBillingRoute) {
    const { data: hasAccess, error } = await supabase.rpc(
      "has_active_subscription"
    );

    if (!error && !hasAccess) {
      return NextResponse.redirect(new URL("/billing", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"],
};
