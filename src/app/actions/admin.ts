"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "unpaid",
]);
const ALLOWED_MANUAL_STATUSES = new Set(["active", "trialing", "past_due", "canceled"]);
const ALLOWED_PLANS = new Set(["starter", "pro"]);

async function findUserIdByEmail(supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>, email: string) {
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

async function ensureAdminSession() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Acesso negado." as const };

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
  if (error || !isAdmin) return { error: "Acesso negado." as const };

  return { ok: true as const };
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const supabase = await createSupabaseServerClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError) {
    return { error: "Credenciais invalidas." };
  }

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_platform_admin");
  if (adminCheckError || !isAdmin) {
    await supabase.auth.signOut();
    return { error: "Usuario sem permissao de admin." };
  }

  redirect("/admin");
}

export async function adminLogoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function atualizarUsuarioAuthAdmin(formData: FormData) {
  const userId = String(formData.get("user_id") || "").trim();
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  if (!userId) redirect("/admin?err=usuario_invalido");
  if (!nome && !email && !password) redirect("/admin?err=sem_alteracoes");
  if (password && password.length < 8) redirect("/admin?err=senha_min_8");

  const patch: Record<string, unknown> = {};
  if (nome) {
    patch.user_metadata = { name: nome };
  }
  if (email) {
    patch.email = email;
    patch.email_confirm = true;
  }
  if (password) {
    patch.password = password;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, patch);
  if (error) redirect(`/admin?err=${encodeURIComponent(`erro_atualizar_usuario:${error.message}`)}`);

  revalidatePath("/admin");
  return { success: true };
}

export async function bloquearUsuarioAuthAdmin(formData: FormData) {
  const userId = String(formData.get("user_id") || "").trim();
  const action = String(formData.get("action") || "ban").trim();
  const duration = String(formData.get("ban_duration") || "8760h").trim();

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  if (!userId) redirect("/admin?err=usuario_invalido");

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: action === "unban" ? "none" : duration,
  });
  if (error) redirect(`/admin?err=${encodeURIComponent(`erro_bloquear_usuario:${error.message}`)}`);

  revalidatePath("/admin");
  return { success: true };
}

export async function excluirUsuarioAuthAdmin(formData: FormData) {
  const userId = String(formData.get("user_id") || "").trim();
  const confirm = String(formData.get("confirm") || "");

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  if (!userId) redirect("/admin?err=usuario_invalido");
  if (confirm !== "sim") redirect("/admin?err=confirmacao_exclusao");

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId, false);
  if (error) redirect(`/admin?err=${encodeURIComponent(`erro_excluir_usuario:${error.message}`)}`);

  revalidatePath("/admin");
  return { success: true };
}

export async function atualizarAssinaturaAdmin(formData: FormData) {
  const empresaId = String(formData.get("empresa_id") || "");
  const status = String(formData.get("status") || "");
  if (!empresaId) return { error: "Empresa invalida." };
  if (!ALLOWED_STATUSES.has(status)) return { error: "Status invalido." };

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: nowIso,
  };

  if (status === "active") {
    patch.current_period_start = nowIso;
    patch.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  if (status === "canceled") {
    patch.cancel_at_period_end = false;
  }

  const { error } = await supabaseAdmin
    .from("assinaturas")
    .update(patch)
    .eq("empresa_id", empresaId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function atualizarPlanoAdmin(formData: FormData) {
  const empresaId = String(formData.get("empresa_id") || "");
  const plano = String(formData.get("plano") || "");
  if (!empresaId) return { error: "Empresa invalida." };
  if (!ALLOWED_PLANS.has(plano)) return { error: "Plano invalido." };

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("assinaturas")
    .update({ plano_id: plano, updated_at: new Date().toISOString() })
    .eq("empresa_id", empresaId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function excluirEmpresaAdmin(formData: FormData) {
  const empresaId = String(formData.get("empresa_id") || "");
  const confirm = String(formData.get("confirm") || "");

  const auth = await ensureAdminSession();
  if ("error" in auth) return { error: auth.error };

  if (!empresaId) return { error: "Empresa invalida." };
  if (confirm !== "sim") return { error: "Confirmacao necessaria." };

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("empresas").delete().eq("id", empresaId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function criarEmpresaManualAdmin(formData: FormData) {
  const empresaNome = String(formData.get("empresa_nome") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const plano = String(formData.get("plano") || "starter");
  const status = String(formData.get("status") || "active");

  const auth = await ensureAdminSession();
  if ("error" in auth) {
    redirect("/admin?err=acesso_negado");
  }

  if (!empresaNome || !email || !senha) {
    redirect("/admin?err=dados_invalidos");
  }
  if (senha.length < 8) {
    redirect("/admin?err=senha_min_8");
  }
  if (!ALLOWED_PLANS.has(plano) || !ALLOWED_MANUAL_STATUSES.has(status)) {
    redirect("/admin?err=plano_ou_status_invalido");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  let ownerUserId: string | null = null;

  const { id: existingUserId, error: existingUserError } = await findUserIdByEmail(
    supabaseAdmin,
    email
  );

  if (existingUserError) {
    redirect(`/admin?err=${encodeURIComponent(`erro_busca_usuario:${existingUserError.message}`)}`);
  }

  if (existingUserId) {
    ownerUserId = existingUserId;
  } else {
    const { data: createdUserData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (userError || !createdUserData.user?.id) {
      redirect(`/admin?err=${encodeURIComponent(`erro_usuario:${userError?.message ?? "falha ao criar usuario"}`)}`);
    }

    ownerUserId = createdUserData.user.id;
  }

  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from("empresas")
    .insert({ nome: empresaNome })
    .select("id")
    .single();

  if (empresaError || !empresa) {
    redirect("/admin?err=erro_criar_empresa");
  }

  const { error: configError } = await supabaseAdmin
    .from("configuracoes")
    .insert({ empresa_id: empresa.id, bloquear_sem_estoque: true });
  if (configError) {
    redirect(`/admin?err=${encodeURIComponent(`erro_config:${configError.message}`)}`);
  }

  const assinaturaPatch: Record<string, unknown> = {
    empresa_id: empresa.id,
    plano_id: plano,
    provider: "manual",
    status,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    trial_ends_at:
      status === "trialing"
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
  };

  const { error: assinaturaError } = await supabaseAdmin
    .from("assinaturas")
    .upsert(assinaturaPatch, { onConflict: "empresa_id" });
  if (assinaturaError) {
    redirect(`/admin?err=${encodeURIComponent(`erro_assinatura:${assinaturaError.message}`)}`);
  }

  const { error: membroError } = await supabaseAdmin
    .from("empresa_membros")
    .insert({
      empresa_id: empresa.id,
      user_id: ownerUserId,
      papel: "owner",
      status: "ativo",
    });
  if (membroError) {
    redirect(`/admin?err=${encodeURIComponent(`erro_membro:${membroError.message}`)}`);
  }

  const { error: prefError } = await supabaseAdmin
    .from("usuario_preferencias")
    .upsert(
      {
        user_id: ownerUserId,
        empresa_ativa_id: empresa.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (prefError) {
    redirect(`/admin?err=${encodeURIComponent(`erro_preferencias:${prefError.message}`)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?ok=empresa_criada");
}
