import Link from "next/link";
import { getPedidos } from "@/lib/data/lookup";
import { PageHeader, Card, Button, Badge } from "@/components/ui/kit";
import { formatCurrency, formatDate } from "@/lib/format";
import { confirmarPedido, cancelarPedido } from "@/app/actions/pedidos";

export default async function PedidosPage() {
  const pedidos = await getPedidos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos de venda"
        subtitle="Fluxo de criação, confirmação e cancelamento."
      >
        <Link href="/pedidos/novo">
          <Button>Novo pedido</Button>
        </Link>
      </PageHeader>
      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Data</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.clientes?.[0]?.razao_social ?? "-"}</td>
                <td>{formatDate(pedido.data_pedido || pedido.created_at)}</td>
                <td>{formatCurrency(Number(pedido.total_liquido || 0))}</td>
                <td>
                  {pedido.status === "confirmado" ? (
                    <Badge tone="success">Confirmado</Badge>
                  ) : pedido.status === "cancelado" ? (
                    <Badge tone="danger">Cancelado</Badge>
                  ) : (
                    <Badge tone="warning">Rascunho</Badge>
                  )}
                </td>
                <td className="flex items-center gap-2">
                  {pedido.status === "rascunho" ? (
                    <form
                      action={async () => {
                        await confirmarPedido(pedido.id);
                      }}
                    >
                      <button className="text-green-700 text-sm" type="submit">
                        Confirmar
                      </button>
                    </form>
                  ) : null}
                  {pedido.status !== "cancelado" ? (
                    <form
                      action={async () => {
                        await cancelarPedido(pedido.id);
                      }}
                    >
                      <button className="text-red-600 text-sm" type="submit">
                        Cancelar
                      </button>
                    </form>
                  ) : null}
                  <Link
                    className="text-blue-600 text-sm"
                    href={`/api/pedidos/${pedido.id}/pdf`}
                  >
                    PDF
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pedidos.length === 0 ? (
          <div className="text-sm text-slate-500 p-4">Nenhum pedido criado.</div>
        ) : null}
      </Card>
    </div>
  );
}
