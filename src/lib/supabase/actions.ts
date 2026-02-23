"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";
import { createSupabaseAdminClient } from "./admin";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    const { error: inviteError } = await supabase.rpc("accept_pending_invites_for_current_user");
    if (inviteError) {
      return { error: inviteError.message };
    }

    return { success: true };
  } catch {
    return { error: "Falha ao autenticar. Tente novamente." };
  }
}

export async function signUp(formData: FormData) {
  void formData;
  return { error: "Cadastro direto desativado. Assine um plano antes de criar conta." };
}

async function findUserIdByEmail(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  let page = 1;
  const perPage = 1000;
  const normalizedEmail = email.toLowerCase();

  for (let i = 0; i < 50; i += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return { error };

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match?.id) return { id: match.id };

    if (!data.nextPage) break;
    page = data.nextPage;
  }

  return { id: null };
}

export async function completePaidSignUpMp(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Dados incompletos para criar conta." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: intent, error: intentError } = await supabaseAdmin
    .from("checkout_intents")
    .select("id, status")
    .eq("email", email)
    .in("status", ["paid"])
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (intentError || !intent) {
    return { error: "Pagamento ainda nao confirmado para este e-mail." };
  }

  const { id: existingUserId, error: existingUserError } = await findUserIdByEmail(email);
  if (existingUserError) {
    return { error: existingUserError.message };
  }

  const supabase = await createSupabaseServerClient();
  if (!existingUserId) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) return { error: signUpError.message };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  await supabase.rpc("accept_pending_invites_for_current_user");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

