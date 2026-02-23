import { getDashboardData } from "@/lib/data/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui/kit";
import DashboardChartsClient from "../_components/DashboardChartsClient";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Resumo operacional dos pedidos e indicadores principais."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de pedidos"
          value={`${data.totalPedidos}`}
          hint="Ultimos registros em tempo real"
        />
        <StatCard
          label="Total faturado"
          value={formatCurrency(data.totalFaturado)}
          hint="Pedidos confirmados"
        />
        <StatCard
          label="Pedidos pendentes"
          value={`${data.totalPendentes}`}
          hint="Aguardando confirmacao"
        />
        <StatCard
          label="Estoque minimo"
          value={`${data.produtosBaixoEstoque.length}`}
          hint="Produtos criticos"
        />
      </div>

      <DashboardChartsClient pedidosConfirmados={data.pedidosConfirmados} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Produtos com estoque baixo
          </h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque</th>
                <th>Minimo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.produtosBaixoEstoque.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    <div className="font-semibold text-slate-800">
                      {produto.descricao}
                    </div>
                    <div className="text-xs text-slate-400">
                      {produto.codigo}
                    </div>
                  </td>
                  <td>{produto.estoque_atual}</td>
                  <td>{produto.estoque_minimo}</td>
                  <td>
                    <Badge tone="danger">Baixo</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Ultimos pedidos
          </h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Data</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimosPedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.clientes?.[0]?.razao_social ?? "-"}</td>
                  <td>{formatDate(pedido.created_at)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
