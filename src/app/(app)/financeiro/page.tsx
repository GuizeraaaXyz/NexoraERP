import Link from "next/link";
import { getContasReceber } from "@/lib/data/lookup";
import { PageHeader, Card } from "@/components/ui/kit";
import { FinanceFilter } from "./_components/FinanceFilter";
import { getCurrentPlanContext } from "@/lib/billing/plan-access";

export default async function FinanceiroPage() {
  const planContext = await getCurrentPlanContext();

  if (!planContext.plan.features.financialModule) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Financeiro"
          subtitle="Contas a receber e acompanhamento de saldo."
        />
        <Card className="space-y-3">
          <div className="text-base font-semibold text-slate-900">
            Recurso disponivel apenas no plano Pro
          </div>
          <div className="text-sm text-slate-600">
            No Starter, voce pode operar vendas, clientes e estoque. Para liberar o Financeiro, faca upgrade.
          </div>
          <div>
            <Link href="/billing" className="erp-button primary">
              Fazer upgrade para Pro
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const contas = await getContasReceber();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Contas a receber e acompanhamento de saldo."
      />
      <Card>
        <FinanceFilter
          contas={contas.map((conta) => ({
            id: conta.id,
            created_at: conta.created_at,
            valor_total: Number(conta.valor_total || 0),
            valor_pago: Number(conta.valor_pago || 0),
            saldo: Number(conta.saldo || 0),
            status: conta.status,
            pedidos: Array.isArray(conta.pedidos)
              ? conta.pedidos[0] ?? null
              : conta.pedidos ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
