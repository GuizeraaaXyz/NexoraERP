"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCliente(values: Record<string, string>) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return { error: "Usuário não autenticado." };
  }

  const { error } = await supabase.from("clientes").insert(values);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}

export async function updateCliente(id: string, values: Record<string, string>) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clientes").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { success: true };
}

export async function deleteCliente(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { success: true };
}

