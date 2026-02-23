import Link from "next/link";
import { getClientes } from "@/lib/data/lookup";
import { PageHeader, Card, Button } from "@/components/ui/kit";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Cadastro completo de clientes e dados fiscais."
      >
        <Link href="/clientes/novo">
          <Button>Novo cliente</Button>
        </Link>
      </PageHeader>
      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Razão social</th>
              <th>CNPJ</th>
              <th>Cidade</th>
              <th>Contato</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>
                  <div className="font-semibold text-slate-800">
                    {cliente.razao_social}
                  </div>
                  <div className="text-xs text-slate-400">{cliente.email}</div>
                </td>
                <td>{cliente.cnpj}</td>
                <td>
                  {cliente.cidade} {cliente.uf}
                </td>
                <td>{cliente.telefone}</td>
                <td>
                  <Link className="text-blue-600" href={`/clientes/${cliente.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 ? (
          <div className="text-sm text-slate-500 p-4">Nenhum cliente cadastrado.</div>
        ) : null}
      </Card>
    </div>
  );
}
