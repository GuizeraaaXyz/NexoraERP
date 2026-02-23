"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/kit";
import { createPedido } from "@/app/actions/pedidos";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  data_pedido: z.string(),
  observacoes: z.string().optional(),
});

type PedidoFormValues = z.infer<typeof schema>;

type Produto = {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
};

type Item = {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number;
};

export function PedidoForm({
  clientes,
  produtos,
}: {
  clientes: { id: string; razao_social: string }[];
  produtos: Produto[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<PedidoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: "",
      data_pedido: new Date().toISOString().slice(0, 10),
      observacoes: "",
    },
  });

  const totals = useMemo(() => {
    const totalBruto = items.reduce(
      (acc, item) => acc + item.quantidade * item.valor_unitario,
      0
    );
    const totalDesconto = items.reduce((acc, item) => acc + item.desconto, 0);
    return {
      totalBruto,
      totalDesconto,
      totalLiquido: totalBruto - totalDesconto,
    };
  }, [items]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { produto_id: "", quantidade: 1, valor_unitario: 0, desconto: 0 },
    ]);
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: PedidoFormValues) {
    setError(null);
    setSuccess(null);
    if (items.length === 0) {
      setError("Inclua pelo menos um item.");
      return;
    }

    const payload = items.map((item) => ({
      ...item,
      total: item.quantidade * item.valor_unitario - item.desconto,
    }));

    const result = await createPedido({
      ...values,
      itens: payload,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Pedido criado com sucesso.");
      setItems([]);
      form.reset();
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="erp-field lg:col-span-2">
          <label>Cliente</label>
          <select className="erp-select" {...form.register("cliente_id")}
            defaultValue=""
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.razao_social}
              </option>
            ))}
          </select>
        </div>
        <div className="erp-field">
          <label>Data do pedido</label>
          <input type="date" className="erp-input" {...form.register("data_pedido")} />
        </div>
      </div>

      <div className="erp-field">
        <label>Observações</label>
        <textarea className="erp-textarea" rows={3} {...form.register("observacoes")} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Itens do pedido</h3>
        <Button type="button" variant="secondary" onClick={addItem}>
          Adicionar item
        </Button>
      </div>

      <div className="erp-card">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Valor unit.</th>
              <th>Desconto</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const produto = produtos.find((p) => p.id === item.produto_id);
              return (
                <tr key={index}>
                  <td>
                    <select
                      className="erp-select"
                      value={item.produto_id}
                      onChange={(event) => {
                        const produtoSelecionado = produtos.find(
                          (p) => p.id === event.target.value
                        );
                        updateItem(index, {
                          produto_id: event.target.value,
                          valor_unitario: produtoSelecionado?.preco ?? 0,
                        });
                      }}
                    >
                      <option value="">Selecione</option>
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.descricao}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-slate-400">
                      {produto ? produto.codigo : ""}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      value={item.quantidade}
                      onChange={(event) =>
                        updateItem(index, {
                          quantidade: Number(event.target.value),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      value={item.valor_unitario}
                      onChange={(event) =>
                        updateItem(index, {
                          valor_unitario: Number(event.target.value),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="erp-input"
                      value={item.desconto}
                      onChange={(event) =>
                        updateItem(index, {
                          desconto: Number(event.target.value),
                        })
                      }
                    />
                  </td>
                  <td>{formatCurrency(item.quantidade * item.valor_unitario - item.desconto)}</td>
                  <td>
                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => removeItem(index)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-8 text-sm text-slate-600">
        <div>
          <div>Total bruto</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(totals.totalBruto)}
          </div>
        </div>
        <div>
          <div>Descontos</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(totals.totalDesconto)}
          </div>
        </div>
        <div>
          <div>Total líquido</div>
          <div className="font-semibold text-slate-900">
            {formatCurrency(totals.totalLiquido)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Salvar pedido</Button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
        {success ? (
          <span className="text-sm text-green-600">{success}</span>
        ) : null}
      </div>
    </form>
  );
}
