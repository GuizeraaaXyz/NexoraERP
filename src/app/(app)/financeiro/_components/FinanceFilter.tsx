"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";

export type Conta = {
  id: string;
  created_at: string;
  valor_total: number;
  valor_pago: number;
  saldo: number;
  status: string;
  pedidos?: { id: string } | { id: string }[] | null;
};

export function FinanceFilter({ contas }: { contas: Conta[] }) {
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");

  const filtradas = useMemo(() => {
    return contas.filter((conta) => {
      const data = new Date(conta.created_at);
      const afterStart = inicio ? data >= new Date(inicio) : true;
      const beforeEnd = fim ? data <= new Date(fim) : true;
      return afterStart && beforeEnd;
    });
  }, [contas, inicio, fim]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="erp-field">
          <label>Data inicial</label>
          <input
            type="date"
            className="erp-input"
            value={inicio}
            onChange={(event) => setInicio(event.target.value)}
          />
        </div>
        <div className="erp-field">
          <label>Data final</label>
          <input
            type="date"
            className="erp-input"
            value={fim}
            onChange={(event) => setFim(event.target.value)}
          />
        </div>
        <button
          className="erp-button ghost"
          onClick={() => {
            setInicio("");
            setFim("");
          }}
        >
          Limpar filtros
        </button>
      </div>

      <table className="erp-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Data</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Saldo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map((conta) => (
            <tr key={conta.id}>
              <td>
                {Array.isArray(conta.pedidos)
                  ? conta.pedidos[0]?.id ?? "-"
                  : conta.pedidos?.id ?? "-"}
              </td>
              <td>{formatDate(conta.created_at)}</td>
              <td>{formatCurrency(conta.valor_total)}</td>
              <td>{formatCurrency(conta.valor_pago)}</td>
              <td>{formatCurrency(conta.saldo)}</td>
              <td>{conta.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
