"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { criarCheckoutPublico } from "@/app/actions/billing";

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<"starter" | "pro">("starter");

  async function handleCheckout(formData: FormData) {
    setError(null);
    formData.set("plan_id", planId);

    const result = await criarCheckoutPublico(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 underline">
            Voltar para o site
          </Link>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <Image
              src="/brand/nexora-logo.png"
              alt="Nexora ERP"
              width={220}
              height={56}
              className="h-12 w-auto object-contain"
            />
            <h1 className="text-2xl font-semibold text-slate-900 mt-3">Assinar</h1>
            <p className="text-sm text-slate-500 mt-1">
              Primeiro pagamento, depois criacao da conta da empresa.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlanId("starter")}
              className={`rounded-xl border p-4 text-left ${
                planId === "starter" ? "border-slate-900 bg-slate-50" : "border-slate-200"
              }`}
            >
              <div className="font-semibold text-slate-900">Starter</div>
              <div className="text-slate-600">R$ 79 / mes</div>
            </button>
            <button
              type="button"
              onClick={() => setPlanId("pro")}
              className={`rounded-xl border p-4 text-left ${
                planId === "pro" ? "border-slate-900 bg-slate-50" : "border-slate-200"
              }`}
            >
              <div className="font-semibold text-slate-900">Pro</div>
              <div className="text-slate-600">R$ 149 / mes</div>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
            Pagamento recorrente via Mercado Pago (PIX ou cartao). Voce sera redirecionado para o checkout.
          </div>

          <form action={handleCheckout} className="space-y-4">
            <div className="erp-field">
              <label>Nome da empresa</label>
              <input name="nome_empresa" required className="erp-input" />
            </div>
            <div className="erp-field">
              <label>E-mail do dono</label>
              <input name="email" type="email" required className="erp-input" />
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <button className="erp-button primary w-full" type="submit">
              Ir para pagamento
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

