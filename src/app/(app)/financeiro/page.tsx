import { getContasReceber } from "@/lib/data/lookup";
import { PageHeader, Card } from "@/components/ui/kit";
import { FinanceFilter } from "./_components/FinanceFilter";

export default async function FinanceiroPage() {
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
