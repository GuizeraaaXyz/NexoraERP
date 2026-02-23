import { Card, PageHeader, Badge } from "@/components/ui/kit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { criarCheckoutAssinatura } from "@/app/actions/billing";
import { formatCurrency } from "@/lib/format";

function statusLabel(status: string | null | undefined) {
  if (status === "active") return { text: "Ativa", tone: "success" as const };
  if (status === "trialing") return { text: "Trial", tone: "warning" as const };
  if (status === "past_due") return { text: "Pagamento pendente", tone: "danger" as const };
  if (status === "canceled") return { text: "Cancelada", tone: "muted" as const };
  return { text: status ?? "Sem assinatura", tone: "muted" as const };
}

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: empresaId } = await supabase.rpc("current_empresa_id");
  const [{ data: empresa }, { data: assinatura }, { data: planos }] = await Promise.all([
    supabase.from("empresas").select("id, nome").eq("id", empresaId).maybeSingle(),
    supabase
      .from("assinaturas")
      .select("plano_id, status, current_period_end, trial_ends_at")
      .eq("empresa_id", empresaId)
      .maybeSingle(),
    supabase.from("planos").select("id, nome, preco_mensal_centavos, ativo").eq("ativo", true).order("preco_mensal_centavos"),
  ]);

  async function onCheckout(formData: FormData) {
    "use server";
    await criarCheckoutAssinatura(formData);
  }

  const status = statusLabel(assinatura?.status);

  return (
    <div className="space-y-6">
      <PageHeader title="Assinatura" subtitle="Gestao de plano e cobranca da empresa." />
      <Card className="space-y-2">
        <div className="text-sm text-slate-600">
          Empresa: <span className="font-semibold text-slate-900">{empresa?.nome ?? "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Status:</span>
          <Badge tone={status.tone}>{status.text}</Badge>
        </div>
        {assinatura?.trial_ends_at ? (
          <div className="text-sm text-slate-500">
            Trial ate {new Date(assinatura.trial_ends_at).toLocaleDateString("pt-BR")}
          </div>
        ) : null}
        {assinatura?.current_period_end ? (
          <div className="text-sm text-slate-500">
            Periodo atual ate {new Date(assinatura.current_period_end).toLocaleDateString("pt-BR")}
          </div>
        ) : null}
        <div className="text-sm text-slate-500">
          Gerencie sua assinatura pelo link enviado no checkout do Mercado Pago.
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-slate-800">Planos</div>
        <div className="grid gap-3 md:grid-cols-2">
          {(planos ?? []).map((plano) => (
            <div key={plano.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="text-lg font-semibold text-slate-900">{plano.nome}</div>
              <div className="text-slate-600">
                {formatCurrency(Number(plano.preco_mensal_centavos) / 100)} / mes
              </div>
              <form action={onCheckout}>
                <input type="hidden" name="plan_id" value={plano.id} />
                <button className="erp-button primary" type="submit">
                  Assinar {plano.nome}
                </button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
