import { PageHeader, Card } from "@/components/ui/kit";
import {
  alterarPapelMembro,
  cancelarConvite,
  convidarMembro,
  inativarMembro,
} from "@/app/actions/equipe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EquipePage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: empresa }, { data: membros }, { data: convites }] = await Promise.all([
    supabase.from("empresas").select("id, nome").limit(1).maybeSingle(),
    supabase
      .from("empresa_membros")
      .select("id, user_id, papel, status, created_at")
      .eq("status", "ativo")
      .order("created_at", { ascending: true }),
    supabase
      .from("convites_empresa")
      .select("id, email, papel, status, expira_em, created_at")
      .eq("status", "pendente")
      .order("created_at", { ascending: false }),
  ]);

  async function onConvidar(formData: FormData) {
    "use server";
    await convidarMembro(formData);
  }

  async function onAlterarPapel(formData: FormData) {
    "use server";
    await alterarPapelMembro(formData);
  }

  async function onInativar(formData: FormData) {
    "use server";
    await inativarMembro(formData);
  }

  async function onCancelarConvite(formData: FormData) {
    "use server";
    await cancelarConvite(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        subtitle="Gestao de funcionarios por empresa."
      />

      <Card className="space-y-4">
        <div className="text-sm text-slate-600">
          Empresa atual: <span className="font-semibold text-slate-900">{empresa?.nome ?? "-"}</span>
        </div>
        <form action={onConvidar} className="grid gap-3 md:grid-cols-4">
          <input
            name="email"
            type="email"
            required
            placeholder="funcionario@empresa.com"
            className="erp-input md:col-span-2"
          />
          <select name="papel" className="erp-input">
            <option value="vendedor">Vendedor</option>
            <option value="financeiro">Financeiro</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="erp-button primary">
            Convidar
          </button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-slate-800">Membros ativos</div>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Papel</th>
              <th>Desde</th>
              <th className="text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {(membros ?? []).map((membro) => (
              <tr key={membro.id}>
                <td className="font-mono text-xs">{membro.user_id}</td>
                <td className="capitalize">{membro.papel}</td>
                <td>{new Date(membro.created_at).toLocaleDateString("pt-BR")}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <form action={onAlterarPapel} className="flex gap-2">
                      <input type="hidden" name="membro_id" value={membro.id} />
                      <select
                        name="papel"
                        defaultValue={membro.papel}
                        className="erp-input h-9 py-1 text-sm"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" className="erp-button ghost h-9 py-1">
                        Salvar
                      </button>
                    </form>
                    <form action={onInativar}>
                      <input type="hidden" name="membro_id" value={membro.id} />
                      <button type="submit" className="erp-button ghost h-9 py-1">
                        Inativar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(membros ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-8">
                  Nenhum membro ativo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-semibold text-slate-800">Convites pendentes</div>
        <table className="erp-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Expira em</th>
              <th className="text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {(convites ?? []).map((convite) => (
              <tr key={convite.id}>
                <td>{convite.email}</td>
                <td className="capitalize">{convite.papel}</td>
                <td>{new Date(convite.expira_em).toLocaleDateString("pt-BR")}</td>
                <td>
                  <form action={onCancelarConvite} className="flex justify-end">
                    <input type="hidden" name="convite_id" value={convite.id} />
                    <button type="submit" className="erp-button ghost h-9 py-1">
                      Cancelar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(convites ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-8">
                  Sem convites pendentes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
