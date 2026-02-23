"use client";

import { LogOut, Search } from "lucide-react";
import { signOut } from "@/lib/supabase/actions";

export function Topbar({ email }: { email?: string | null }) {
  return (
    <div className="erp-topbar">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1">
          <Search size={14} className="text-slate-500" />
          <input
            placeholder="Buscar em pedidos, clientes, produtos..."
            className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-72"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-500">{email ?? "Usuário"}</div>
        <form action={signOut}>
          <button className="erp-button ghost flex items-center gap-2" type="submit">
            <LogOut size={14} />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
