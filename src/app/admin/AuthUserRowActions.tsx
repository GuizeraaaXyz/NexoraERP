"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User;
  isBanned: boolean;
  onUpdate: (formData: FormData) => void | Promise<void>;
  onBlock: (formData: FormData) => void | Promise<void>;
  onDelete: (formData: FormData) => void | Promise<void>;
};

export default function AuthUserRowActions({
  user,
  isBanned,
  onUpdate,
  onBlock,
  onDelete,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="erp-button ghost h-8 py-1" onClick={() => setIsOpen(true)}>
        Editar
      </button>

      {isBanned ? (
        <form action={onBlock}>
          <input type="hidden" name="user_id" value={user.id} />
          <input type="hidden" name="action" value="unban" />
          <button type="submit" className="erp-button ghost h-8 py-1">
            Desbloquear
          </button>
        </form>
      ) : (
        <details className="relative">
          <summary className="erp-button ghost h-8 py-1 cursor-pointer list-none">Bloquear</summary>
          <div className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-slate-200 bg-white p-3 shadow">
            <form action={onBlock} className="space-y-2">
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="action" value="ban" />
              <select name="ban_duration" defaultValue="8760h" className="erp-input h-8 py-1 text-sm">
                <option value="24h">24h</option>
                <option value="168h">7 dias</option>
                <option value="720h">30 dias</option>
                <option value="8760h">1 ano</option>
              </select>
              <button type="submit" className="erp-button ghost h-8 py-1 w-full">
                Confirmar
              </button>
            </form>
          </div>
        </details>
      )}

      <details className="relative">
        <summary className="erp-button ghost h-8 py-1 cursor-pointer list-none">Excluir</summary>
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-slate-200 bg-white p-3 shadow">
          <form action={onDelete} className="space-y-2">
            <input type="hidden" name="user_id" value={user.id} />
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <input
                type="checkbox"
                name="confirm"
                value="sim"
                checked={confirmDelete}
                onChange={(event) => setConfirmDelete(event.target.checked)}
              />
              Confirmar exclusao
            </label>
            <button type="submit" className="erp-button ghost h-8 py-1 w-full" disabled={!confirmDelete}>
              Excluir
            </button>
          </form>
        </div>
      </details>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 text-center text-base font-semibold text-slate-800">Editar usuario</div>
            <form
              action={onUpdate}
              className="mx-auto max-w-sm space-y-3"
              onSubmit={() => {
                setIsOpen(false);
                setConfirmDelete(false);
              }}
            >
              <input type="hidden" name="user_id" value={user.id} />
              <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 text-right">Nome</label>
                <input
                  name="nome"
                  type="text"
                  defaultValue={(user.user_metadata as { name?: string } | null)?.name ?? ""}
                  placeholder="Nome do cliente"
                  className="erp-input"
                />
                <label className="text-xs font-semibold text-slate-500 text-right">E-mail</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email ?? ""}
                  placeholder="email@cliente.com"
                  className="erp-input"
                />
                <label className="text-xs font-semibold text-slate-500 text-right">Senha</label>
                <input
                  name="password"
                  type="text"
                  placeholder="Nova senha (min 8)"
                  className="erp-input"
                />
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  className="erp-button ghost h-9 py-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="erp-button primary h-9 py-1">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
