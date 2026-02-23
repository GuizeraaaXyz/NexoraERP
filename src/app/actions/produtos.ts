"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createProduto(values: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return { error: "Usuário não autenticado." };
  }

  const payload = values;

  const { error } = await supabase.from("produtos").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  return { success: true };
}

export async function updateProduto(id: string, values: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("produtos").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  return { success: true };
}

export async function deleteProduto(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/produtos");
  revalidatePath("/estoque");
  return { success: true };
}

