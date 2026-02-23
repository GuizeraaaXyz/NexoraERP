"use client";

import Link from "next/link";
import { useState } from "react";
import { completePaidSignUpMp } from "@/lib/supabase/actions";

export default function CriarContaClient() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await completePaidSignUpMp(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Criar conta da empresa</h1>
          <p className="text-sm text-slate-500 mt-1">
            Finalize seu cadastro com o mesmo e-mail usado no pagamento.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="erp-field">
            <label>E-mail</label>
            <input name="email" type="email" className="erp-input" required />
          </div>
          <div className="erp-field">
            <label>Senha</label>
            <input name="password" type="password" className="erp-input" required />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button className="erp-button primary w-full" type="submit">
            Criar conta e entrar
          </button>
        </form>

        <div className="text-sm text-slate-500">
          Ja tem conta?{" "}
          <Link href="/login" className="text-blue-600 font-semibold">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
