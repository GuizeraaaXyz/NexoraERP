import Link from "next/link";
import { PageHeader, Card, Button } from "@/components/ui/kit";
import { PedidoForm } from "../_components/PedidoForm";
import { getClientes, getProdutos } from "@/lib/data/lookup";

export default async function NovoPedidoPage() {
  const [clientes, produtos] = await Promise.all([getClientes(), getProdutos()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Novo pedido" subtitle="Monte o pedido com itens e descontos.">
        <Link href="/pedidos">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </PageHeader>
      <Card>
        <PedidoForm
          clientes={clientes.map((cliente) => ({
            id: cliente.id,
            razao_social: cliente.razao_social,
          }))}
          produtos={produtos.map((produto) => ({
            id: produto.id,
            codigo: produto.codigo,
            descricao: produto.descricao,
            unidade: produto.unidade,
            preco: Number(produto.preco || 0),
          }))}
        />
      </Card>
    </div>
  );
}
