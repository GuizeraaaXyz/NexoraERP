"use client";

import { useMemo, useState } from "react";

type EmpresaResumo = {
  empresa_id: string;
  nome: string;
  created_at: string;
  assinatura_status: string | null;
  plano_id: string | null;
};

type AuthUserResumo = {
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
};

type RowKey = "empresas" | "usuarios" | "membros" | "ativas" | "atrasadas";

type Props = {
  totalEmpresas: number;
  totalAuthUsers: number;
  totalMembers: number;
  totalAtivas: number;
  totalAtrasadas: number;
  empresas: EmpresaResumo[];
  usuarios: AuthUserResumo[];
};

const rowLabels: Record<RowKey, string> = {
  empresas: "Empresas",
  usuarios: "Usuarios (auth)",
  membros: "Membros",
  ativas: "Empresas ativas/trial",
  atrasadas: "Empresas atrasadas",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function AdminSummaryTable({
  totalEmpresas,
  totalAuthUsers,
  totalMembers,
  totalAtivas,
  totalAtrasadas,
  empresas,
  usuarios,
}: Props) {
  const [open, setOpen] = useState<RowKey | null>(null);

  const empresasAtivas = useMemo(
    () => empresas.filter((empresa) => empresa.assinatura_status === "active" || empresa.assinatura_status === "trialing"),
    [empresas]
  );
  const empresasAtrasadas = useMemo(
    () => empresas.filter((empresa) => empresa.assinatura_status === "past_due"),
    [empresas]
  );

  const modalTitle = open ? rowLabels[open] : "";

  return (
    <>
      <table className="erp-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {([
            ["empresas", totalEmpresas],
            ["usuarios", totalAuthUsers],
            ["membros", totalMembers],
            ["ativas", totalAtivas],
            ["atrasadas", totalAtrasadas],
          ] as const).map(([key, total]) => (
            <tr
              key={key}
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => setOpen(key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setOpen(key);
              }}
            >
              <td className="text-blue-700">{rowLabels[key]}</td>
              <td>{total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 text-center text-base font-semibold text-slate-800">{modalTitle}</div>

            {open === "empresas" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">
                  Total de empresas cadastradas: <span className="font-semibold text-slate-900">{totalEmpresas}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">Ultimas empresas</div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.slice(0, 5).map((empresa) => (
                      <tr key={empresa.empresa_id}>
                        <td>{empresa.nome}</td>
                        <td className="uppercase">{empresa.plano_id ?? "-"}</td>
                        <td>{empresa.assinatura_status ?? "sem assinatura"}</td>
                        <td>{formatDate(empresa.created_at)}</td>
                      </tr>
                    ))}
                    {empresas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400 py-6">
                          Nenhuma empresa encontrada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            {open === "usuarios" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">
                  Total de usuarios ativos: <span className="font-semibold text-slate-900">{totalAuthUsers}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">Ultimos usuarios</div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>E-mail</th>
                      <th>Criado em</th>
                      <th>Ultimo login</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.slice(0, 5).map((user, index) => {
                      const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
                      const isBanned = bannedUntil ? bannedUntil.getTime() > Date.now() : false;
                      return (
                        <tr key={`${user.email ?? "user"}-${index}`}>
                          <td className="font-mono text-slate-700">{user.email ?? "-"}</td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>{formatDate(user.last_sign_in_at)}</td>
                          <td>{isBanned ? "Bloqueado" : "Ativo"}</td>
                        </tr>
                      );
                    })}
                    {usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400 py-6">
                          Nenhum usuario encontrado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            {open === "membros" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">
                  Total de membros cadastrados:{" "}
                  <span className="font-semibold text-slate-900">{totalMembers}</span>
                </div>
                <div className="text-sm text-slate-500">
                  Soma de registros na tabela <span className="font-mono">empresa_membros</span>.
                </div>
              </div>
            ) : null}

            {open === "ativas" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">
                  Total de empresas ativas/trial:{" "}
                  <span className="font-semibold text-slate-900">{totalAtivas}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">Ultimas ativas/trial</div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresasAtivas.slice(0, 5).map((empresa) => (
                      <tr key={empresa.empresa_id}>
                        <td>{empresa.nome}</td>
                        <td className="uppercase">{empresa.plano_id ?? "-"}</td>
                        <td>{empresa.assinatura_status ?? "-"}</td>
                        <td>{formatDate(empresa.created_at)}</td>
                      </tr>
                    ))}
                    {empresasAtivas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400 py-6">
                          Nenhuma empresa ativa/trial.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            {open === "atrasadas" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">
                  Total de empresas atrasadas:{" "}
                  <span className="font-semibold text-slate-900">{totalAtrasadas}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">Ultimas atrasadas</div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresasAtrasadas.slice(0, 5).map((empresa) => (
                      <tr key={empresa.empresa_id}>
                        <td>{empresa.nome}</td>
                        <td className="uppercase">{empresa.plano_id ?? "-"}</td>
                        <td>{empresa.assinatura_status ?? "-"}</td>
                        <td>{formatDate(empresa.created_at)}</td>
                      </tr>
                    ))}
                    {empresasAtrasadas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400 py-6">
                          Nenhuma empresa atrasada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="flex justify-center pt-4">
              <button type="button" className="erp-button ghost h-9 py-1" onClick={() => setOpen(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
