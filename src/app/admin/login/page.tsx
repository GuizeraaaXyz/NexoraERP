"use client";

import { useState } from "react";
import { adminLoginAction } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    const result = await adminLoginAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="min-h-screen bg-slate-100 grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Platform</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acesso do criador para visao global do SaaS.
          </p>
        </div>
        <form action={handleLogin} className="space-y-4">
          <div className="erp-field">
            <label>E-mail</label>
            <input className="erp-input" name="email" type="email" required />
          </div>
          <div className="erp-field">
            <label>Senha</label>
            <input className="erp-input" name="password" type="password" required />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button className="erp-button primary w-full" type="submit">
            Entrar no admin
          </button>
        </form>
      </div>
    </main>
  );
}
