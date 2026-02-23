import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui/kit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminSummaryTable from "@/app/admin/AdminSummaryTable";
import {
  adminLogoutAction,
  atualizarAssinaturaAdmin,
  atualizarPlanoAdmin,
  atualizarUsuarioAuthAdmin,
  bloquearUsuarioAuthAdmin,
  criarEmpresaManualAdmin,
  excluirEmpresaAdmin,
  excluirUsuarioAuthAdmin,
} from "@/app/actions/admin";
import AuthUserRowActions from "@/app/admin/AuthUserRowActions";

type AdminEmpresa = {
  empresa_id: string;
  nome: string;
  created_at: string;
  assinatura_status: string | null;
  plano_id: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  total_membros: number;
  membros_ativos: number;
};

function badgeForStatus(status: string | null) {
  if (status === "active") return <Badge tone="success">Ativa</Badge>;
  if (status === "trialing") return <Badge tone="warning">Trial</Badge>;
  if (status === "past_due") return <Badge tone="danger">Atrasada</Badge>;
  if (status === "canceled") return <Badge tone="muted">Cancelada</Badge>;
  if (status === "unpaid") return <Badge tone="danger">Nao paga</Badge>;
  if (status === "incomplete") return <Badge tone="warning">Incompleta</Badge>;
  return <Badge tone="muted">Sem assinatura</Badge>;
}

function statusLabel(status: string) {
  if (status === "active") return "Ativas";
  if (status === "trialing") return "Trial";
  if (status === "past_due") return "Atrasadas";
  if (status === "canceled") return "Canceladas";
  return "Todos";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    plano?: string;
    ok?: string;
    err?: string;
    user_q?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const userQ = (params.user_q ?? "").trim().toLowerCase();
  const status = (params.status ?? "all").trim();
  const plano = (params.plano ?? "all").trim();
  const ok = (params.ok ?? "").trim();
  const err = (params.err ?? "").trim();

  const supabaseAdmin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const [
    { data: empresasData, error: empresasError },
    { count: totalMembers },
    { data: authUsers, error: authUsersError },
    { data: authUsersPage, error: authUsersPageError },
  ] = await Promise.all([
    supabase.rpc("admin_empresas_overview"),
    supabaseAdmin.from("empresa_membros").select("id", { count: "exact", head: true }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 }),
  ]);

  const totalAuthUsers = authUsersError ? 0 : authUsers?.total ?? authUsers?.users?.length ?? 0;
  const authUsersList = authUsersPageError
    ? []
    : (authUsersPage?.users ?? [])
        .filter((user) => !user.deleted_at)
        .filter((user) => (userQ ? (user.email ?? "").toLowerCase().includes(userQ) : true));

  async function contarUsuariosAtivos() {
    let page = 1;
    const perPage = 1000;
    let totalAtivos = 0;

    for (let i = 0; i < 50; i += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) return 0;
      totalAtivos += data.users.filter((user) => !user.deleted_at).length;
      if (!data.nextPage) break;
      page = data.nextPage;
    }

    return totalAtivos;
  }

  const empresasRaw = (empresasData ?? []) as AdminEmpresa[];
  const empresas = empresasRaw.filter((empresa) => {
    const bySearch = q
      ? empresa.nome.toLowerCase().includes(q) || empresa.empresa_id.toLowerCase().includes(q)
      : true;
    const byStatus = status !== "all" ? (empresa.assinatura_status ?? "") === status : true;
    const byPlano = plano !== "all" ? (empresa.plano_id ?? "") === plano : true;
    return bySearch && byStatus && byPlano;
  });

  const totalEmpresas = empresasRaw.length;
  const ativas = empresasRaw.filter((e) =>
    e.assinatura_status === "active" || e.assinatura_status === "trialing"
  ).length;
  const atrasadas = empresasRaw.filter((e) => e.assinatura_status === "past_due").length;
  const receitaMensalBase = empresasRaw.reduce((acc, item) => {
    if (item.assinatura_status !== "active" && item.assinatura_status !== "trialing") return acc;
    if (item.plano_id === "pro") return acc + 149;
    if (item.plano_id === "starter") return acc + 79;
    return acc;
  }, 0);

  async function onAtualizarAssinatura(formData: FormData) {
    "use server";
    await atualizarAssinaturaAdmin(formData);
  }

  async function onAtualizarPlano(formData: FormData) {
    "use server";
    await atualizarPlanoAdmin(formData);
  }

  async function onCriarEmpresaManual(formData: FormData) {
    "use server";
    await criarEmpresaManualAdmin(formData);
  }

  async function onExcluirEmpresa(formData: FormData) {
    "use server";
    await excluirEmpresaAdmin(formData);
  }

  async function onLogout() {
    "use server";
    await adminLogoutAction();
  }

  async function onAtualizarUsuarioAuth(formData: FormData) {
    "use server";
    await atualizarUsuarioAuthAdmin(formData);
  }

  async function onBloquearUsuarioAuth(formData: FormData) {
    "use server";
    await bloquearUsuarioAuthAdmin(formData);
  }

  async function onExcluirUsuarioAuth(formData: FormData) {
    "use server";
    await excluirUsuarioAuthAdmin(formData);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Admin Platform" subtitle="Controle global de clientes e faturamento.">
          <form action={onLogout}>
            <button type="submit" className="erp-button ghost">
              Sair do admin
            </button>
          </form>
        </PageHeader>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Empresas</div>
            <div className="text-2xl font-semibold text-slate-900">{totalEmpresas}</div>
          </Card>
          <Card className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Ativas/Trial</div>
            <div className="text-2xl font-semibold text-slate-900">{ativas}</div>
          </Card>
          <Card className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Atrasadas</div>
            <div className="text-2xl font-semibold text-slate-900">{atrasadas}</div>
          </Card>
          <Card className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">MRR base</div>
            <div className="text-2xl font-semibold text-slate-900">R$ {receitaMensalBase}</div>
            <div className="text-xs text-slate-400">Usuarios (auth): {totalAuthUsers}</div>
            <div className="text-xs text-slate-400">Membros: {totalMembers ?? 0}</div>
          </Card>
        </div>

        <Card>
          <div className="font-semibold text-slate-800 mb-3">Resumo de clientes</div>
          <AdminSummaryTable
            totalEmpresas={totalEmpresas}
            totalAuthUsers={totalAuthUsers}
            totalMembers={totalMembers ?? 0}
            totalAtivas={ativas}
            totalAtrasadas={atrasadas}
            empresas={empresasRaw.map((empresa) => ({
              empresa_id: empresa.empresa_id,
              nome: empresa.nome,
              created_at: empresa.created_at,
              assinatura_status: empresa.assinatura_status,
              plano_id: empresa.plano_id,
            }))}
            usuarios={authUsersList.map((user) => ({
              email: user.email ?? null,
              created_at: user.created_at ?? null,
              last_sign_in_at: user.last_sign_in_at ?? null,
              banned_until: user.banned_until ?? null,
            }))}
          />
        </Card>

        {ok ? (
          <Card className="text-sm text-green-700">Operacao concluida: {ok}</Card>
        ) : null}
        {err ? (
          <Card className="text-sm text-red-700">Erro: {decodeURIComponent(err)}</Card>
        ) : null}
        {empresasError ? (
          <Card className="text-sm text-red-700">
            Erro ao carregar empresas: {empresasError.message}
          </Card>
        ) : null}

        <Card className="space-y-4">
          <div className="font-semibold text-slate-800">Criar empresa e login manual (sem pagamento)</div>
          <form action={onCriarEmpresaManual} className="grid gap-3 md:grid-cols-5">
            <input name="empresa_nome" required placeholder="Nome da empresa" className="erp-input md:col-span-2" />
            <input name="email" type="email" required placeholder="E-mail do dono" className="erp-input" />
            <input name="senha" type="text" required placeholder="Senha inicial" className="erp-input" />
            <select name="plano" defaultValue="starter" className="erp-input">
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
            <select name="status" defaultValue="active" className="erp-input">
              <option value="active">active</option>
              <option value="trialing">trialing</option>
              <option value="past_due">past_due</option>
              <option value="canceled">canceled</option>
            </select>
            <button type="submit" className="erp-button primary md:col-span-1">
              Criar cliente manual
            </button>
          </form>
        </Card>

        <Card className="space-y-4">
          <form className="grid gap-3 md:grid-cols-4" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou ID"
              className="erp-input md:col-span-2"
            />
            <select name="status" defaultValue={status} className="erp-input">
              <option value="all">Todos status</option>
              <option value="active">active</option>
              <option value="trialing">trialing</option>
              <option value="past_due">past_due</option>
              <option value="canceled">canceled</option>
              <option value="incomplete">incomplete</option>
              <option value="unpaid">unpaid</option>
            </select>
            <select name="plano" defaultValue={plano} className="erp-input">
              <option value="all">Todos planos</option>
              <option value="starter">starter</option>
              <option value="pro">pro</option>
            </select>
            <button type="submit" className="erp-button primary md:col-span-1">
              Filtrar
            </button>
          </form>

          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin?status=all" className="erp-button ghost h-8 py-1">Todos</Link>
            <Link href="/admin?status=active" className="erp-button ghost h-8 py-1">Ativas</Link>
            <Link href="/admin?status=trialing" className="erp-button ghost h-8 py-1">Trial</Link>
            <Link href="/admin?status=past_due" className="erp-button ghost h-8 py-1">Atrasadas</Link>
            <Link href="/admin?status=canceled" className="erp-button ghost h-8 py-1">Canceladas</Link>
            <Link href="/admin" className="erp-button ghost h-8 py-1">Limpar filtros</Link>
          </div>

          <div className="text-sm text-slate-500">
            Exibindo {empresas.length} empresa(s) ({statusLabel(status)}).
          </div>
        </Card>

        <Card>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Engajamento</th>
                <th>Fim periodo</th>
                <th className="text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.empresa_id}>
                  <td>
                    <div className="font-semibold text-slate-800">{empresa.nome}</div>
                    <div className="text-xs text-slate-400 font-mono">{empresa.empresa_id}</div>
                    <div className="text-xs text-slate-400">
                      Criada em {new Date(empresa.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td>
                    <form action={onAtualizarPlano} className="flex items-center gap-2">
                      <input type="hidden" name="empresa_id" value={empresa.empresa_id} />
                      <select
                        name="plano"
                        defaultValue={empresa.plano_id ?? "starter"}
                        className="erp-input h-9 py-1 text-sm uppercase"
                      >
                        <option value="starter">starter</option>
                        <option value="pro">pro</option>
                      </select>
                      <button type="submit" className="erp-button ghost h-9 py-1">
                        Salvar
                      </button>
                    </form>
                  </td>
                  <td>{badgeForStatus(empresa.assinatura_status)}</td>
                  <td>
                    <div>{empresa.membros_ativos}/{empresa.total_membros} membros ativos</div>
                  </td>
                  <td>
                    {empresa.current_period_end
                      ? new Date(empresa.current_period_end).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <form action={onAtualizarAssinatura} className="flex items-center gap-2">
                        <input type="hidden" name="empresa_id" value={empresa.empresa_id} />
                        <select
                          name="status"
                          defaultValue={empresa.assinatura_status ?? "incomplete"}
                          className="erp-input h-9 py-1 text-sm"
                        >
                          <option value="trialing">trialing</option>
                          <option value="active">active</option>
                          <option value="past_due">past_due</option>
                          <option value="canceled">canceled</option>
                          <option value="incomplete">incomplete</option>
                          <option value="unpaid">unpaid</option>
                        </select>
                        <button type="submit" className="erp-button ghost h-9 py-1">
                          Salvar
                        </button>
                      </form>

                      <details className="relative">
                        <summary className="erp-button ghost h-9 py-1 cursor-pointer list-none">
                          Excluir
                        </summary>
                        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-slate-200 bg-white p-3 shadow">
                          <form action={onExcluirEmpresa} className="space-y-2">
                            <input type="hidden" name="empresa_id" value={empresa.empresa_id} />
                            <label className="text-xs text-slate-500 flex items-center gap-2">
                              <input type="checkbox" name="confirm" value="sim" required />
                              Confirmar exclusao
                            </label>
                            <button type="submit" className="erp-button ghost h-8 py-1 w-full">
                              Excluir
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-8">
                    Nenhuma empresa no filtro atual.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="font-semibold text-slate-800 mb-3">Clientes (usuarios do Auth)</div>
          <form method="get" className="mb-3 flex flex-wrap items-center gap-2">
            <input
              name="user_q"
              defaultValue={userQ}
              placeholder="Buscar por e-mail"
              className="erp-input w-64"
            />
            <button type="submit" className="erp-button primary h-9 py-1">
              Filtrar
            </button>
            {userQ ? (
              <Link href="/admin" className="erp-button ghost h-9 py-1">
                Limpar
              </Link>
            ) : null}
          </form>
          <table className="erp-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Criado em</th>
                <th>Ultimo login</th>
                <th>Status</th>
                <th className="text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {authUsersList.map((user) => {
                const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
                const isBanned = Boolean(user.banned_until);

                return (
                  <tr key={user.id}>
                    <td className="font-mono text-slate-700">{user.email ?? "-"}</td>
                    <td>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td>
                      {isBanned && bannedUntil
                        ? `Bloqueado ate ${bannedUntil.toLocaleDateString("pt-BR")}`
                        : "Ativo"}
                    </td>
                    <td className="text-right">
                      <AuthUserRowActions
                        user={user}
                        isBanned={isBanned}
                        onUpdate={onAtualizarUsuarioAuth}
                        onBlock={onBloquearUsuarioAuth}
                        onDelete={onExcluirUsuarioAuth}
                      />
                    </td>
                  </tr>
                );
              })}
              {authUsersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="text-xs text-slate-500 mt-2">
            Exibindo {authUsersList.length} de {await contarUsuariosAtivos()} usuarios ativos.
          </div>
        </Card>
      </div>
    </div>
  );
}
