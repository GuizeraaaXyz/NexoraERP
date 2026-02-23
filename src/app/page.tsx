import Link from "next/link";
import Image from "next/image";
import { PLAN_DEFINITIONS } from "@/lib/billing/plan-definitions";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_500px_at_10%_-10%,#dbeafe,transparent),radial-gradient(1000px_500px_at_90%_0%,#fee2e2,transparent),#f8fafc]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <header className="flex items-center justify-between">
          <Image
            src="/brand/nexora-logo.png"
            alt="Nexora ERP"
            width={220}
            height={56}
            className="h-12 w-auto object-contain"
          />
          <div className="flex items-center gap-3">
            <Link href="/login" className="erp-button ghost">
              Entrar
            </Link>
            <Link href="/checkout" className="erp-button primary">
              Assinar agora
            </Link>
          </div>
        </header>

        <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              ERP de vendas para sua empresa vender com processo profissional
            </h1>
            <p className="text-lg text-slate-600">
              Controle pedidos, estoque, financeiro e equipe em um painel simples.
              Assine, crie sua conta e comece no mesmo dia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/checkout" className="erp-button primary">
                Comecar assinatura
              </Link>
              <Link href="/login" className="erp-button ghost">
                Ja sou cliente
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">Planos</div>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Starter</div>
                <div className="text-slate-600">R$ 79 / mes</div>
                <div className="mt-2 text-xs text-slate-500">
                  Ate {PLAN_DEFINITIONS.starter.limits.maxActiveMembers} membros e sem Financeiro.
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Pro</div>
                <div className="text-slate-600">R$ 149 / mes</div>
                <div className="mt-2 text-xs text-slate-500">
                  Modulo Financeiro e operacao sem limite de membros/produtos.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
