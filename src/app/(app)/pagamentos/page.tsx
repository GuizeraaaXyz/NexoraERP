import { getPagamentos, getPedidos } from "@/lib/data/lookup";
import { PageHeader, Card, Badge } from "@/components/ui/kit";
import { formatCurrency, formatDate } from "@/lib/format";
import { PagamentoForm } from "./_components/PagamentoForm";

export default async function PagamentosPage() {
  const [pagamentos, pedidos] = await Promise.all([getPagamentos(), getPedidos()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        subtitle="Registro manual das formas de pagamento."
      />
      <Card>
        <PagamentoForm
          pedidos={pedidos.map((pedido) => ({
            id: pedido.id,
            label: `${pedido.clientes?.[0]?.razao_social ?? "Cliente"} - ${formatCurrency(
              Number(pedido.total_liquido || 0)
            )}`,
          }))}
        />
      </Card>
      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Forma</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((pagamento) => (
              <tr key={pagamento.id}>
                <td>{pagamento.pedidos?.[0]?.id ?? "-"}</td>
                <td>{pagamento.forma}</td>
                <td>{formatCurrency(Number(pagamento.valor_pago || 0))}</td>
                <td>{pagamento.data_pagamento ? formatDate(pagamento.data_pagamento) : "-"}</td>
                <td>
                  {pagamento.status === "pago" ? (
                    <Badge tone="success">Pago</Badge>
                  ) : (
                    <Badge tone="warning">Pendente</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
