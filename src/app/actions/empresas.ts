"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function ensureAuth() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "Usuario nao autenticado." as const };
  }
  return { supabase };
}

function revalidateEmpresaContext() {
  revalidatePath("/dashboard");
  revalidatePath("/billing");
  revalidatePath("/clientes");
  revalidatePath("/produtos");
  revalidatePath("/pedidos");
  revalidatePath("/financeiro");
  revalidatePath("/configuracoes");
  revalidatePath("/equipe");
  revalidatePath("/empresas");
}

export async function criarEmpresaAction(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) throw new Error("Informe o nome da empresa.");

  const context = await ensureAuth();
  if ("error" in context) throw new Error(context.error);

  const { error } = await context.supabase.rpc("criar_empresa", { p_nome: nome });
  if (error) throw new Error(error.message);

  revalidateEmpresaContext();
}

export async function trocarEmpresaAtivaAction(formData: FormData) {
  const empresaId = String(formData.get("empresa_id") || "");
  if (!empresaId) throw new Error("Empresa invalida.");

  const context = await ensureAuth();
  if ("error" in context) throw new Error(context.error);

  const { error } = await context.supabase.rpc("definir_empresa_ativa", {
    p_empresa_id: empresaId,
  });
  if (error) throw new Error(error.message);

  revalidateEmpresaContext();
}

export async function excluirEmpresaAction(formData: FormData) {
  const empresaId = String(formData.get("empresa_id") || "");
  if (!empresaId) throw new Error("Empresa invalida.");

  const context = await ensureAuth();
  if ("error" in context) throw new Error(context.error);

  const { error } = await context.supabase.rpc("excluir_empresa", {
    p_empresa_id: empresaId,
  });
  if (error) throw new Error(error.message);

  revalidateEmpresaContext();
}
