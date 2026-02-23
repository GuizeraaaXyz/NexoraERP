import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card, Button } from "@/components/ui/kit";
import { ClienteForm } from "../_components/ClienteForm";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", params.id)
    .single();

  return (
    <div className="space-y-6">
      <PageHeader title="Editar cliente" subtitle="Atualize dados cadastrais.">
        <Link href="/clientes">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </PageHeader>
      <Card>
        <ClienteForm defaultValues={cliente ?? {}} clienteId={params.id} />
      </Card>
    </div>
  );
}
