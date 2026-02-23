import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button } from "@/components/ui/kit";
import { ProdutoForm } from "../_components/ProdutoForm";

export default async function EditarProdutoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", params.id)
    .single();

  return (
    <div className="space-y-6">
      <PageHeader title="Editar produto" subtitle="Atualize dados do item.">
        <Link href="/produtos">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </PageHeader>
      <Card>
        <ProdutoForm defaultValues={produto ?? {}} produtoId={params.id} />
      </Card>
    </div>
  );
}
