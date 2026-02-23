"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/supabase/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result?.error) setError(result.error);
    if (result?.success) router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <Image
          src="/brand/nexora-logo.png"
          alt="Nexora ERP"
          width={220}
          height={56}
          className="h-12 w-auto object-contain"
        />
        <p className="text-sm text-slate-500 mt-1">
          Entre na sua empresa para acessar o sistema.
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
          Entrar
        </button>
      </form>
      <div className="text-sm text-slate-500 flex items-center justify-between">
        <Link className="text-blue-600 font-semibold" href="/checkout">
          Assinar e criar conta
        </Link>
        <Link className="text-slate-500 underline" href="/">
          Ver site
        </Link>
      </div>
    </div>
  );
}

