import { getConfiguracao } from "@/lib/data/lookup";
import { PageHeader, Card } from "@/components/ui/kit";
import { ConfigToggle } from "../estoque/toggle";

export default async function ConfiguracoesPage() {
  const config = await getConfiguracao();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Parâmetros operacionais do módulo de pedidos."
      />
      <Card className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">
            Bloquear venda sem estoque
          </div>
          <div className="text-sm text-slate-500">
            Exige saldo mínimo para confirmar pedidos.
          </div>
        </div>
        <ConfigToggle initialValue={config.bloquear_sem_estoque} />
      </Card>
    </div>
  );
}
