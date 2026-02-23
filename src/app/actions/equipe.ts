"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MANAGER_ROLES = new Set(["owner", "admin"]);
const ALLOWED_ROLES = new Set(["admin", "financeiro", "vendedor"]);

async function getActiveMembership() {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) return { error: "Usuario nao autenticado." as const };

  const { data: empresaId, error: empresaIdError } = await supabase.rpc("current_empresa_id");
  if (empresaIdError || !empresaId) {
    return { error: "Empresa ativa nao encontrada." as const };
  }

  const { data: membership, error } = await supabase
    .from("empresa_membros")
    .select("empresa_id, papel")
    .eq("empresa_id", empresaId)
    .eq("user_id", user.user.id)
    .eq("status", "ativo")
    .maybeSingle();

  if (error || !membership) {
    return { error: "Membro da empresa nao encontrado." as const };
  }

  return { supabase, userId: user.user.id, membership };
}

export async function convidarMembro(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const papel = String(formData.get("papel") || "vendedor");

  if (!email) return { error: "Informe um e-mail valido." };
  if (!ALLOWED_ROLES.has(papel)) return { error: "Papel invalido." };

  const context = await getActiveMembership();
  if ("error" in context) return { error: context.error };

  if (!MANAGER_ROLES.has(context.membership.papel)) {
    return { error: "Sem permissao para convidar membros." };
  }

  const { error } = await context.supabase.from("convites_empresa").insert({
    empresa_id: context.membership.empresa_id,
    email,
    papel,
    convidado_por: context.userId,
    status: "pendente",
  });

  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { success: true };
}

export async function alterarPapelMembro(formData: FormData) {
  const membroId = String(formData.get("membro_id") || "");
  const papel = String(formData.get("papel") || "");

  if (!membroId) return { error: "Membro invalido." };
  if (!ALLOWED_ROLES.has(papel)) return { error: "Papel invalido." };

  const context = await getActiveMembership();
  if ("error" in context) return { error: context.error };

  if (!MANAGER_ROLES.has(context.membership.papel)) {
    return { error: "Sem permissao para alterar papeis." };
  }

  const { error } = await context.supabase
    .from("empresa_membros")
    .update({ papel })
    .eq("id", membroId)
    .neq("user_id", context.userId);

  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { success: true };
}

export async function inativarMembro(formData: FormData) {
  const membroId = String(formData.get("membro_id") || "");
  if (!membroId) return { error: "Membro invalido." };

  const context = await getActiveMembership();
  if ("error" in context) return { error: context.error };

  if (!MANAGER_ROLES.has(context.membership.papel)) {
    return { error: "Sem permissao para inativar membros." };
  }

  const { error } = await context.supabase
    .from("empresa_membros")
    .update({ status: "inativo" })
    .eq("id", membroId)
    .neq("user_id", context.userId);

  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { success: true };
}

export async function cancelarConvite(formData: FormData) {
  const conviteId = String(formData.get("convite_id") || "");
  if (!conviteId) return { error: "Convite invalido." };

  const context = await getActiveMembership();
  if ("error" in context) return { error: context.error };

  if (!MANAGER_ROLES.has(context.membership.papel)) {
    return { error: "Sem permissao para cancelar convites." };
  }

  const { error } = await context.supabase
    .from("convites_empresa")
    .update({ status: "cancelado" })
    .eq("id", conviteId)
    .eq("status", "pendente");

  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { success: true };
}
