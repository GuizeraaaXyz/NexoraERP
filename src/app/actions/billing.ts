"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPreapproval } from "@/lib/mercadopago/api";

const BILLING_ROLES = new Set(["owner", "admin"]);

function getMercadoPagoCheckoutError(error: unknown) {
  if (!(error instanceof Error)) return null;
  const normalized = error.message.toLowerCase();
  if (normalized.includes("unauthorized")) {
    return "Credenciais Mercado Pago invalidas.";
  }
  return "Falha ao iniciar checkout Mercado Pago. Tente novamente em instantes.";
}

async function createPendingCompanyCheckout(
  nomeEmpresa: string,
  email: string,
  planId: string
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: plano, error: planError } = await supabaseAdmin
    .from("planos")
    .select("id, preco_mensal_centavos, ativo")
    .eq("id", planId)
    .eq("ativo", true)
    .maybeSingle();

  if (planError || !plano) return { error: "Plano invalido." as const };

  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from("empresas")
    .insert({ nome: nomeEmpresa })
    .select("id")
    .single();

  if (empresaError || !empresa) {
    return { error: empresaError?.message ?? "Erro ao criar empresa." };
  }

  await supabaseAdmin
    .from("configuracoes")
    .insert({ empresa_id: empresa.id, bloquear_sem_estoque: true });

  return { supabaseAdmin, plano, empresa, email };
}

async function getBillingContext() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: "Usuario nao autenticado." as const };
  }

  const { data: empresaData } = await supabase.rpc("current_empresa_id");
  if (!empresaData) {
    return { error: "Empresa ativa nao encontrada." as const };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("empresa_membros")
    .select("papel")
    .eq("empresa_id", empresaData)
    .eq("user_id", auth.user.id)
    .eq("status", "ativo")
    .maybeSingle();

  if (membershipError || !membership || !BILLING_ROLES.has(membership.papel)) {
    return { error: "Sem permissao para gerenciar assinatura." as const };
  }

  const [{ data: empresa }, { data: assinatura }] = await Promise.all([
    supabase.from("empresas").select("id, nome").eq("id", empresaData).maybeSingle(),
    supabase
      .from("assinaturas")
      .select("id, status, plano_id, current_period_end, trial_ends_at")
      .eq("empresa_id", empresaData)
      .maybeSingle(),
  ]);

  return {
    supabase,
    user: auth.user,
    empresa,
    empresaId: empresaData as string,
    assinatura,
  };
}

export async function criarCheckoutAssinatura(formData: FormData) {
  const planId = String(formData.get("plan_id") || "starter");
  const context = await getBillingContext();
  if ("error" in context) return { error: context.error };

  const { data: plano, error: planError } = await context.supabase
    .from("planos")
    .select("id, nome, preco_mensal_centavos, ativo")
    .eq("id", planId)
    .eq("ativo", true)
    .maybeSingle();

  if (planError || !plano) return { error: "Plano invalido." };

  const amount = Number(plano.preco_mensal_centavos) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Plano com preco invalido." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookToken = process.env.MERCADOPAGO_WEBHOOK_TOKEN?.trim();
  const notificationUrl = webhookToken
    ? `${appUrl}/api/mercadopago/webhook?token=${webhookToken}`
    : `${appUrl}/api/mercadopago/webhook`;
  let preapproval;
  try {
    preapproval = await createPreapproval({
      reason: `Nexora ERP - Plano ${plano.nome}`,
      payer_email: context.user.email,
      external_reference: context.empresaId,
      back_url: `${appUrl}/billing?success=1`,
      notification_url: notificationUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      status: "pending",
    });
  } catch (error) {
    const checkoutError = getMercadoPagoCheckoutError(error);
    return { error: checkoutError ?? "Falha ao criar checkout." };
  }

  await context.supabase.from("assinaturas").upsert(
    {
      empresa_id: context.empresaId,
      plano_id: plano.id,
      provider: "mercadopago",
      status: "incomplete",
      stripe_subscription_id: preapproval.id,
    },
    { onConflict: "empresa_id" }
  );

  if (!preapproval.init_point) return { error: "Falha ao iniciar checkout." };
  redirect(preapproval.init_point);
}

export async function criarCheckoutPublico(formData: FormData) {
  const nomeEmpresa = String(formData.get("nome_empresa") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const planId = String(formData.get("plan_id") || "starter");

  if (!nomeEmpresa) return { error: "Informe o nome da empresa." };
  if (!email) return { error: "Informe um e-mail valido." };

  const base = await createPendingCompanyCheckout(nomeEmpresa, email, planId);
  if ("error" in base) return { error: base.error };
  const { supabaseAdmin, plano, empresa } = base;

  const amount = Number(plano.preco_mensal_centavos) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Plano com preco invalido." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookToken = process.env.MERCADOPAGO_WEBHOOK_TOKEN?.trim();
  const notificationUrl = webhookToken
    ? `${appUrl}/api/mercadopago/webhook?token=${webhookToken}`
    : `${appUrl}/api/mercadopago/webhook`;
  let preapproval;
  try {
    preapproval = await createPreapproval({
      reason: `Nexora ERP - Plano ${plano.id}`,
      payer_email: email,
      external_reference: empresa.id,
      back_url: `${appUrl}/criar-conta`,
      notification_url: notificationUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      status: "pending",
    });
  } catch (error) {
    const checkoutError = getMercadoPagoCheckoutError(error);
    return { error: checkoutError ?? "Falha ao iniciar checkout." };
  }

  await supabaseAdmin.from("assinaturas").upsert(
    {
      empresa_id: empresa.id,
      plano_id: plano.id,
      provider: "mercadopago",
      status: "incomplete",
      stripe_subscription_id: preapproval.id,
    },
    { onConflict: "empresa_id" }
  );

  await supabaseAdmin.from("checkout_intents").insert({
    email,
    empresa_id: empresa.id,
    plano_id: plano.id,
    status: "pending",
    stripe_checkout_session_id: `mp:${preapproval.id}`,
  });

  if (!preapproval.init_point) return { error: "Falha ao iniciar checkout." };
  redirect(preapproval.init_point);
}
