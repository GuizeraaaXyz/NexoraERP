"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPagamento } from "@/app/actions/pagamentos";
import { Button } from "@/components/ui/kit";

const schema = z.object({
  pedido_id: z.string().uuid("Selecione um pedido"),
  forma: z.string().min(1),
  valor_pago: z.number().min(0.01),
  status: z.enum(["pendente", "pago"]),
  data_pagamento: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PagamentoForm({
  pedidos,
}: {
  pedidos: { id: string; label: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      pedido_id: "",
      forma: "Pix",
      valor_pago: 0,
      status: "pendente",
      data_pagamento: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    const result = await createPagamento(values);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Pagamento registrado.");
      form.reset();
    }
  }

  return (
    <form className="grid gap-4 lg:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="erp-field lg:col-span-2">
        <label>Pedido</label>
        <select className="erp-select" {...form.register("pedido_id")}>
          <option value="">Selecione</option>
          {pedidos.map((pedido) => (
            <option key={pedido.id} value={pedido.id}>
              {pedido.label}
            </option>
          ))}
        </select>
      </div>
      <div className="erp-field">
        <label>Forma</label>
        <select className="erp-select" {...form.register("forma")}>
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão</option>
          <option value="Boleto">Boleto</option>
          <option value="Outros">Outros</option>
        </select>
      </div>
      <div className="erp-field">
        <label>Valor pago</label>
        <input
          type="number"
          step="0.01"
          className="erp-input"
          {...form.register("valor_pago", { valueAsNumber: true })}
        />
      </div>
      <div className="erp-field">
        <label>Status</label>
        <select className="erp-select" {...form.register("status")}
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>
      <div className="erp-field">
        <label>Data</label>
        <input type="date" className="erp-input" {...form.register("data_pagamento")} />
      </div>
      <div className="lg:col-span-3 flex items-center gap-3">
        <Button type="submit">Registrar pagamento</Button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
        {success ? (
          <span className="text-sm text-green-600">{success}</span>
        ) : null}
      </div>
    </form>
  );
}
