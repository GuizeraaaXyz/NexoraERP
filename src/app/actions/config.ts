"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateConfiguracao(bloquear: boolean) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Usuário não autenticado." };

  const { error } = await supabase.from("configuracoes").upsert({
    bloquear_sem_estoque: bloquear,
  });

  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { success: true };
}

