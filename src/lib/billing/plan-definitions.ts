export const PLAN_IDS = ["starter", "pro"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthlyCents: number;
  description: string;
  highlights: string[];
  limits: {
    maxActiveMembers: number;
    maxProducts: number;
  };
  features: {
    financialModule: boolean;
    inviteMembers: boolean;
  };
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthlyCents: 7900,
    description: "Para operacao inicial com equipe pequena.",
    highlights: [
      "Ate 2 membros ativos",
      "Ate 100 produtos",
      "Pedidos, estoque e clientes",
      "Sem modulo Financeiro",
    ],
    limits: {
      maxActiveMembers: 2,
      maxProducts: 100,
    },
    features: {
      financialModule: false,
      inviteMembers: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyCents: 14900,
    description: "Para operacao completa com escala.",
    highlights: [
      "Membros ativos ilimitados",
      "Produtos ilimitados",
      "Pedidos, estoque e clientes",
      "Modulo Financeiro liberado",
    ],
    limits: {
      maxActiveMembers: Number.POSITIVE_INFINITY,
      maxProducts: Number.POSITIVE_INFINITY,
    },
    features: {
      financialModule: true,
      inviteMembers: true,
    },
  },
};

export function normalizePlanId(value: string | null | undefined): PlanId {
  if (value === "pro") return "pro";
  return "starter";
}

export function getPlanDefinition(value: string | null | undefined) {
  return PLAN_DEFINITIONS[normalizePlanId(value)];
}
