import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlanDefinition, normalizePlanId, type PlanId } from "@/lib/billing/plan-definitions";

export type CurrentPlanContext = {
  empresaId: string | null;
  planId: PlanId;
  plan: ReturnType<typeof getPlanDefinition>;
  assinaturaStatus: string | null;
};

export async function getCurrentPlanContext(): Promise<CurrentPlanContext> {
  const supabase = await createSupabaseServerClient();
  const { data: empresaId } = await supabase.rpc("current_empresa_id");

  if (!empresaId) {
    const starter = getPlanDefinition("starter");
    return {
      empresaId: null,
      planId: "starter",
      plan: starter,
      assinaturaStatus: null,
    };
  }

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("plano_id, status")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  const planId = normalizePlanId(assinatura?.plano_id);
  return {
    empresaId: empresaId as string,
    planId,
    plan: getPlanDefinition(planId),
    assinaturaStatus: assinatura?.status ?? null,
  };
}
