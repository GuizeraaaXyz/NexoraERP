import Link from "next/link";
import { PageHeader, Card, Button } from "@/components/ui/kit";
import { ProdutoForm } from "../_components/ProdutoForm";

export default function NovoProdutoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo produto" subtitle="Cadastro de itens.">
        <Link href="/produtos">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </PageHeader>
      <Card>
        <ProdutoForm />
      </Card>
    </div>
  );
}
