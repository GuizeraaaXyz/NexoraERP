import Link from "next/link";
import { PageHeader, Card, Button } from "@/components/ui/kit";
import { ClienteForm } from "../_components/ClienteForm";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo cliente" subtitle="Cadastro rápido para pedidos.">
        <Link href="/clientes">
          <Button variant="ghost">Voltar</Button>
        </Link>
      </PageHeader>
      <Card>
        <ClienteForm />
      </Card>
    </div>
  );
}
