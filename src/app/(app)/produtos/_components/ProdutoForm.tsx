"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProduto, updateProduto } from "@/app/actions/produtos";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/kit";

const schema = z.object({
  codigo: z.string().min(1, "Informe o código"),
  descricao: z.string().min(2, "Informe a descrição"),
  unidade: z.string().min(1, "Informe a unidade"),
  preco: z.number().min(0),
  ativo: z.boolean().optional(),
  estoque_atual: z.number().min(0),
  estoque_minimo: z.number().min(0),
  imagem_url: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProdutoForm({
  defaultValues,
  produtoId,
}: {
  defaultValues?: Partial<FormValues>;
  produtoId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      codigo: "",
      descricao: "",
      unidade: "UN",
      preco: 0,
      ativo: true,
      estoque_atual: 0,
      estoque_minimo: 0,
      ...defaultValues,
    },
  });

  async function uploadImage(file: File) {
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(filename, file, { upsert: true });

    if (error) {
      setUploading(false);
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    setUploading(false);
    return data.publicUrl;
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);

    const payload: Record<string, unknown> = {
      ...values,
      ativo: values.ativo ?? true,
    };

    const file = (document.getElementById("imagem") as HTMLInputElement)
      ?.files?.[0];
    if (file) {
      try {
        payload.imagem_url = await uploadImage(file);
      } catch (err) {
        setError((err as Error).message);
        return;
      }
    }

    const result = produtoId
      ? await updateProduto(produtoId, payload)
      : await createProduto(payload);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Dados salvos com sucesso.");
      if (!produtoId) form.reset();
    }
  }

  return (
    <form
      className="grid gap-4 lg:grid-cols-2"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="erp-field">
        <label>Código</label>
        <input className="erp-input" {...form.register("codigo")} />
        {form.formState.errors.codigo ? (
          <span className="text-xs text-red-600">
            {form.formState.errors.codigo.message}
          </span>
        ) : null}
      </div>
      <div className="erp-field">
        <label>Descrição</label>
        <input className="erp-input" {...form.register("descricao")} />
      </div>
      <div className="erp-field">
        <label>Unidade</label>
        <input className="erp-input" {...form.register("unidade")} />
      </div>
      <div className="erp-field">
        <label>Preço</label>
        <input
          type="number"
          step="0.01"
          className="erp-input"
          {...form.register("preco", { valueAsNumber: true })}
        />
      </div>
      <div className="erp-field">
        <label>Estoque atual</label>
        <input
          type="number"
          step="0.01"
          className="erp-input"
          {...form.register("estoque_atual", { valueAsNumber: true })}
        />
      </div>
      <div className="erp-field">
        <label>Estoque mínimo</label>
        <input
          type="number"
          step="0.01"
          className="erp-input"
          {...form.register("estoque_minimo", { valueAsNumber: true })}
        />
      </div>
      <div className="erp-field">
        <label>Imagem</label>
        <input id="imagem" type="file" className="erp-input" accept="image/*" />
      </div>
      <div className="erp-field">
        <label>Ativo</label>
        <select
          className="erp-select"
          {...form.register("ativo", {
            setValueAs: (value) => value === "true",
          })}
        >
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      </div>
      <div className="lg:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={uploading}>
          {uploading ? "Enviando..." : "Salvar produto"}
        </Button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
        {success ? (
          <span className="text-sm text-green-600">{success}</span>
        ) : null}
      </div>
    </form>
  );
}
