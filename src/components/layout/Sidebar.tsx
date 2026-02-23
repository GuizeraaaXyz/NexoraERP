"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Package,
  ClipboardList,
  Boxes,
  CreditCard,
  CircleDollarSign,
  Shield,
  Wallet,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/empresas", label: "Empresas", icon: Users },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/billing", label: "Assinatura", icon: CircleDollarSign },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="erp-sidebar">
      <div className="px-5 py-6 border-b border-slate-800">
        <Image
          src="/brand/nexora-logo.png"
          alt="Nexora ERP"
          width={240}
          height={64}
          className="h-14 w-auto object-contain"
        />
      </div>
      <nav className="px-3 py-4 space-y-1 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-5 py-4 text-xs text-slate-500">
        Versão 1.0
      </div>
    </aside>
  );
}

