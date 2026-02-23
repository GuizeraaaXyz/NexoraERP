import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedPayment, getPreapproval } from "@/lib/mercadopago/api";

type MpWebhookPayload = {
  id?: string | number;
  topic?: string;
  type?: string;
  data?: { id?: string | number };
};

function mapMpStatus(status?: string | null) {
  if (!status) return "incomplete";
  const normalized = status.toLowerCase();
  if (normalized === "authorized" || normalized === "active") return "active";
  if (normalized === "paused") return "past_due";
  if (normalized === "cancelled" || normalized === "canceled") return "canceled";
  if (normalized === "pending") return "incomplete";
  return "unpaid";
}

function toIso(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseSignatureHeader(signature: string) {
  const values = signature
    .split(",")
    .map((entry) => entry.trim())
    .reduce<Record<string, string>>((acc, entry) => {
      const [key, value] = entry.split("=", 2);
      if (key && value) acc[key] = value;
      return acc;
    }, {});

  return {
    ts: values.ts ?? "",
    v1: values.v1 ?? "",
  };
}

function safeCompareHex(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isValidMpSignature(request: Request, notificationId: string, secret: string) {
  const signatureHeader = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  if (!signatureHeader || !requestId || !notificationId) return false;

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) return false;

  const manifest = `id:${notificationId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return safeCompareHex(v1.toLowerCase(), expected);
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const webhookToken = process.env.MERCADOPAGO_WEBHOOK_TOKEN?.trim();
    if (webhookToken) {
      const provided = url.searchParams.get("token") ?? "";
      if (provided !== webhookToken) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    }

    const payload = (await request.json().catch(() => ({}))) as MpWebhookPayload & {
      resource?: string;
    };
    const topic = (payload.type ?? payload.topic ?? "").toString();
    const rawId =
      payload.data?.id ??
      payload.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id");
    let id = rawId ? String(rawId) : "";
    if (!id && payload.resource) {
      const parts = payload.resource.split("/");
      id = parts[parts.length - 1] ?? "";
    }
    if (!id) return NextResponse.json({ received: true });

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
    if (webhookSecret && !isValidMpSignature(request, id, webhookSecret)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let preapprovalId = id;
    if (topic === "subscription_authorized_payment") {
      const payment = await getAuthorizedPayment(id);
      if (!payment.preapproval_id) return NextResponse.json({ received: true });
      preapprovalId = String(payment.preapproval_id);
    }

    if (topic !== "subscription_preapproval" && topic !== "preapproval" && topic !== "subscription_authorized_payment") {
      return NextResponse.json({ received: true });
    }

    const preapproval = await getPreapproval(preapprovalId);
    const status = mapMpStatus(preapproval.status);
    const email = (preapproval.payer_email ?? "").toLowerCase();
    const externalReference = preapproval.external_reference ?? null;
    const periodStart = toIso(preapproval.auto_recurring?.start_date) ?? new Date().toISOString();
    const periodEnd =
      toIso(preapproval.auto_recurring?.end_date) ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const supabaseAdmin = createSupabaseAdminClient();

    let empresaId = externalReference;
    let planoId: string | null = null;

    if (!empresaId && email) {
      const { data: intent } = await supabaseAdmin
        .from("checkout_intents")
        .select("empresa_id, plano_id")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .maybeSingle();
      empresaId = intent?.empresa_id ?? null;
      planoId = intent?.plano_id ?? null;
    } else if (empresaId) {
      const { data: intent } = await supabaseAdmin
        .from("checkout_intents")
        .select("plano_id")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .maybeSingle();
      planoId = intent?.plano_id ?? null;
    }

    if (email) {
      if (status === "active") {
        await supabaseAdmin
          .from("checkout_intents")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: `mp:${preapprovalId}`,
          })
          .eq("email", email)
          .eq("status", "pending");
      } else if (status === "canceled") {
        await supabaseAdmin
          .from("checkout_intents")
          .update({ status: "canceled" })
          .eq("email", email)
          .eq("status", "pending");
      }
    }

    if (empresaId) {
      await supabaseAdmin.from("assinaturas").upsert(
        {
          empresa_id: empresaId,
          plano_id: planoId,
          provider: "mercadopago",
          status,
          current_period_start: status === "active" ? periodStart : null,
          current_period_end: status === "active" ? periodEnd : null,
          cancel_at_period_end: status === "canceled",
          stripe_subscription_id: preapprovalId,
        },
        { onConflict: "empresa_id" }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "mercadopago webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
