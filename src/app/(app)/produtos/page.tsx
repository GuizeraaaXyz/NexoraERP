import Link from "next/link";
import Image from "next/image";
import { getProdutos } from "@/lib/data/lookup";
import { PageHeader, Card, Button, Badge } from "@/components/ui/kit";
import { formatCurrency } from "@/lib/format";

export default async function ProdutosPage() {
  const produtos = await getProdutos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        subtitle="Catálogo de itens e estoque disponível."
      >
        <Link href="/produtos/novo">
          <Button>Novo produto</Button>
        </Link>
      </PageHeader>
      <Card>
        <table className="erp-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {produto.imagem_url ? (
                        <Image
                          src={produto.imagem_url}
                          alt={produto.descricao}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="text-xs text-slate-400">IMG</div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {produto.descricao}
                      </div>
                      <div className="text-xs text-slate-400">
                        {produto.codigo}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{formatCurrency(Number(produto.preco))}</td>
                <td>
                  {produto.estoque_atual} ({produto.unidade})
                </td>
                <td>
                  {produto.ativo ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="muted">Inativo</Badge>
                  )}
                </td>
                <td>
                  <Link className="text-blue-600" href={`/produtos/${produto.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {produtos.length === 0 ? (
          <div className="text-sm text-slate-500 p-4">Nenhum produto cadastrado.</div>
        ) : null}
      </Card>
    </div>
  );
}
