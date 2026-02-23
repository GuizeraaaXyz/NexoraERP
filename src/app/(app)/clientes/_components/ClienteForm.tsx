"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCliente, updateCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/kit";

const schema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contato: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ClienteForm({
  defaultValues,
  clienteId,
}: {
  defaultValues?: Partial<FormValues>;
  clienteId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      razao_social: "",
      cnpj: "",
      inscricao_estadual: "",
      endereco: "",
      cidade: "",
      bairro: "",
      uf: "",
      cep: "",
      telefone: "",
      email: "",
      contato: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    const result = clienteId
      ? await updateCliente(clienteId, values as Record<string, string>)
      : await createCliente(values as Record<string, string>);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Dados salvos com sucesso.");
      if (!clienteId) form.reset();
    }
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="erp-field lg:col-span-2">
        <label>Razão social</label>
        <input className="erp-input" {...form.register("razao_social")} />
        {form.formState.errors.razao_social ? (
          <span className="text-xs text-red-600">
            {form.formState.errors.razao_social.message}
          </span>
        ) : null}
      </div>
      <div className="erp-field">
        <label>CNPJ</label>
        <input className="erp-input" {...form.register("cnpj")} />
      </div>
      <div className="erp-field">
        <label>Inscrição estadual</label>
        <input className="erp-input" {...form.register("inscricao_estadual")} />
      </div>
      <div className="erp-field">
        <label>Endereço</label>
        <input className="erp-input" {...form.register("endereco")} />
      </div>
      <div className="erp-field">
        <label>Bairro</label>
        <input className="erp-input" {...form.register("bairro")} />
      </div>
      <div className="erp-field">
        <label>Cidade</label>
        <input className="erp-input" {...form.register("cidade")} />
      </div>
      <div className="erp-field">
        <label>UF</label>
        <input className="erp-input" {...form.register("uf")} />
      </div>
      <div className="erp-field">
        <label>CEP</label>
        <input className="erp-input" {...form.register("cep")} />
      </div>
      <div className="erp-field">
        <label>Telefone</label>
        <input className="erp-input" {...form.register("telefone")} />
      </div>
      <div className="erp-field">
        <label>E-mail</label>
        <input className="erp-input" {...form.register("email")} />
      </div>
      <div className="erp-field">
        <label>Contato</label>
        <input className="erp-input" {...form.register("contato")} />
      </div>

      <div className="lg:col-span-2 flex items-center gap-3">
        <Button type="submit">Salvar cliente</Button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
        {success ? (
          <span className="text-sm text-green-600">{success}</span>
        ) : null}
      </div>
    </form>
  );
}
