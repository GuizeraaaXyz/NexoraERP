import { PageHeader, Card, Badge } from "@/components/ui/kit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  criarEmpresaAction,
  trocarEmpresaAtivaAction,
  excluirEmpresaAction,
} from "@/app/actions/empresas";

type EmpresaRow = {
  empresa_id: string;
  nome: string;
  papel: "owner" | "admin" | "financeiro" | "vendedor";
  status: "ativo" | "inativo";
  ativa: boolean;
};

export default async function EmpresasPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("listar_minhas_empresas");
  const empresas = (data ?? []) as EmpresaRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        subtitle="Gerencie suas empresas e selecione qual esta ativa no ERP."
      />

      <Card className="space-y-4">
        <div className="font-semibold text-slate-800">Nova empresa</div>
        <form action={criarEmpresaAction} className="flex gap-3">
          <input
            name="nome"
            required
            className="erp-input"
            placeholder="Nome da empresa"
          />
          <button type="submit" className="erp-button primary">
            Criar e ativar
          </button>
        </form>
      </Card>

      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Ativa</th>
              <th className="text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa.empresa_id}>
                <td className="font-semibold text-slate-800">{empresa.nome}</td>
                <td className="capitalize">{empresa.papel}</td>
                <td className="capitalize">{empresa.status}</td>
                <td>
                  {empresa.ativa ? (
                    <Badge tone="success">Ativa</Badge>
                  ) : (
                    <Badge tone="muted">Nao ativa</Badge>
                  )}
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    {!empresa.ativa ? (
                      <form action={trocarEmpresaAtivaAction}>
                        <input type="hidden" name="empresa_id" value={empresa.empresa_id} />
                        <button type="submit" className="erp-button ghost h-9 py-1">
                          Ativar
                        </button>
                      </form>
                    ) : null}
                    {empresa.papel === "owner" ? (
                      <form action={excluirEmpresaAction}>
                        <input type="hidden" name="empresa_id" value={empresa.empresa_id} />
                        <button type="submit" className="erp-button ghost h-9 py-1">
                          Excluir
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {empresas.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
