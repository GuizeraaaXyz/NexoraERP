import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getClientes() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, razao_social, cnpj, cidade, uf, telefone, email")
    .order("razao_social");
  return data ?? [];
}

export async function getProdutos() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("produtos")
    .select(
      "id, codigo, descricao, unidade, preco, imagem_url, ativo, estoque_atual, estoque_minimo"
    )
    .order("descricao");
  return data ?? [];
}

export async function getPedidos() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pedidos")
    .select(
      "id, status, total_liquido, total_bruto, created_at, data_pedido, clientes(razao_social)"
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPagamentos() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pagamentos")
    .select("id, forma, valor_pago, status, data_pagamento, pedidos(id)")
    .order("data_pagamento", { ascending: false });
  return data ?? [];
}

export async function getContasReceber() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contas_receber")
    .select("id, valor_total, valor_pago, saldo, status, created_at, pedidos(id)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getConfiguracao() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("bloquear_sem_estoque")
    .maybeSingle();
  return data ?? { bloquear_sem_estoque: true };
}

