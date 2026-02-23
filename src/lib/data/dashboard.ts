import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  const [{ count: totalPedidos }, { count: totalPendentes }] = await Promise.all([
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("status", "rascunho"),
  ]);

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("total_liquido, created_at, status");

  const totalFaturado = (pedidos ?? []).reduce((acc, item) => {
    if (item.status === "confirmado") {
      return acc + Number(item.total_liquido || 0);
    }
    return acc;
  }, 0);
  const pedidosConfirmados = pedidos ?? [];

  const { data: produtosRaw } = await supabase
    .from("produtos")
    .select("id, codigo, descricao, estoque_atual, estoque_minimo")
    .order("estoque_atual", { ascending: true })
    .limit(24);
  const produtosBaixoEstoque =
    produtosRaw?.filter(
      (produto) =>
        Number(produto.estoque_atual) <= Number(produto.estoque_minimo)
    ) ?? [];

  const { data: ultimosPedidos } = await supabase
    .from("pedidos")
    .select("id, status, total_liquido, created_at, clientes(razao_social)")
    .order("created_at", { ascending: false })
    .limit(6);

  return {
    totalPedidos: totalPedidos ?? 0,
    totalPendentes: totalPendentes ?? 0,
    totalFaturado,
    produtosBaixoEstoque: produtosBaixoEstoque ?? [],
    ultimosPedidos: ultimosPedidos ?? [],
    pedidosConfirmados: pedidosConfirmados ?? [],
  };
}

