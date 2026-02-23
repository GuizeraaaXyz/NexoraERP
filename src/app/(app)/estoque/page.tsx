import { getProdutos, getConfiguracao } from "@/lib/data/lookup";
import { PageHeader, Card, Badge } from "@/components/ui/kit";
import { ConfigToggle } from "./toggle";

export default async function EstoquePage() {
  const produtos = await getProdutos();
  const config = await getConfiguracao();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de estoque"
        subtitle="Acompanhamento de saldo e alertas de estoque mínimo."
      />
      <Card className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">
            Bloquear venda sem estoque
          </div>
          <div className="text-sm text-slate-500">
            Impede confirmação quando o saldo for insuficiente.
          </div>
        </div>
        <ConfigToggle initialValue={config.bloquear_sem_estoque} />
      </Card>
      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Estoque</th>
              <th>Mínimo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => {
              const baixo = Number(produto.estoque_atual) <= Number(produto.estoque_minimo);
              return (
                <tr key={produto.id}>
                  <td>
                    <div className="font-semibold text-slate-800">
                      {produto.descricao}
                    </div>
                    <div className="text-xs text-slate-400">{produto.codigo}</div>
                  </td>
                  <td>{produto.estoque_atual}</td>
                  <td>{produto.estoque_minimo}</td>
                  <td>
                    {baixo ? (
                      <Badge tone="danger">Baixo</Badge>
                    ) : (
                      <Badge tone="success">Normal</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
