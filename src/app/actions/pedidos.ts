"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PedidoItemInput = {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
  total: number;
};

export async function createPedido(input: {
  cliente_id: string;
  data_pedido: string;
  observacoes?: string;
  itens: PedidoItemInput[];
}) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) return { error: "Usuário não autenticado." };

  const totalBruto = input.itens.reduce(
    (acc, item) => acc + Number(item.quantidade) * Number(item.valor_unitario),
    0
  );
  const totalDescontos = input.itens.reduce(
    (acc, item) => acc + Number(item.desconto || 0),
    0
  );
  const totalLiquido = totalBruto - totalDescontos;

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: input.cliente_id,
      data_pedido: input.data_pedido,
      observacoes: input.observacoes,
      status: "rascunho",
      desconto_total: totalDescontos,
      total_bruto: totalBruto,
      total_liquido: totalLiquido,
    })
    .select("id")
    .single();

  if (pedidoError || !pedido) {
    return { error: pedidoError?.message ?? "Erro ao criar pedido." };
  }

  const itensPayload = input.itens.map((item) => ({
    pedido_id: pedido.id,
    ...item,
  }));

  const { error: itensError } = await supabase
    .from("pedido_itens")
    .insert(itensPayload);

  if (itensError) return { error: itensError.message };

  revalidatePath("/pedidos");
  return { success: true, pedidoId: pedido.id };
}

export async function confirmarPedido(pedidoId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("confirmar_pedido", {
    p_pedido_id: pedidoId,
  });

  if (error) return { error: error.message };

  revalidatePath("/pedidos");
  revalidatePath("/estoque");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function cancelarPedido(pedidoId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ status: "cancelado" })
    .eq("id", pedidoId);
  if (error) return { error: error.message };
  revalidatePath("/pedidos");
  return { success: true };
}

