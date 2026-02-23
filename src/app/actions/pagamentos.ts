"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createPagamento(input: {
  pedido_id: string;
  forma: string;
  valor_pago: number;
  status: "pendente" | "pago";
  data_pagamento?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Usuário não autenticado." };

  const { error } = await supabase.from("pagamentos").insert(input);

  if (error) return { error: error.message };

  const { data: conta } = await supabase
    .from("contas_receber")
    .select("id, valor_total, valor_pago")
    .eq("pedido_id", input.pedido_id)
    .maybeSingle();

  if (conta) {
    const novoValorPago = Number(conta.valor_pago) + Number(input.valor_pago);
    const saldo = Number(conta.valor_total) - novoValorPago;
    await supabase
      .from("contas_receber")
      .update({
        valor_pago: novoValorPago,
        saldo,
        status: saldo <= 0 ? "quitado" : "aberto",
      })
      .eq("id", conta.id);
  }

  revalidatePath("/pagamentos");
  revalidatePath("/financeiro");
  return { success: true };
}

