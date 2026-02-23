import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";

async function fetchImageBytes(url?: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.arrayBuffer();
    return { buffer, contentType };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await context.params;
  const pedidoId = resolvedParams.id;

  const supabase = await createSupabaseServerClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select(
      "id, status, created_at, data_pedido, total_bruto, total_liquido, desconto_total, clientes(*), pedido_itens(*, produtos(*)), pagamentos(*), contas_receber(*)"
    )
    .eq("id", pedidoId)
    .single();

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let cursorY = 800;
  const marginX = 40;

  const drawText = (
    text: string,
    x: number,
    y: number,
    size = 10,
    bold = false
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.12, 0.2),
    });
  };

  drawText("Pedido de Venda", marginX, cursorY, 16, true);
  cursorY -= 18;
  drawText(`Pedido: ${pedido.id}`, marginX, cursorY, 10);
  drawText(`Status: ${pedido.status}`, marginX + 260, cursorY, 10);
  cursorY -= 16;
  drawText(`Data: ${formatDate(pedido.data_pedido || pedido.created_at)}`, marginX, cursorY, 10);
  cursorY -= 24;

  const cliente = Array.isArray(pedido.clientes) ? pedido.clientes[0] : pedido.clientes;
  drawText("Cliente", marginX, cursorY, 12, true);
  cursorY -= 16;
  drawText(`${cliente?.razao_social ?? ""}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`CNPJ: ${cliente?.cnpj ?? ""}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`Contato: ${cliente?.contato ?? ""}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`Telefone: ${cliente?.telefone ?? ""}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`E-mail: ${cliente?.email ?? ""}`, marginX, cursorY, 10);
  cursorY -= 24;

  drawText("Itens", marginX, cursorY, 12, true);
  cursorY -= 16;

  const headers = ["Imagem", "Código", "Descrição", "Qtd", "Valor", "Desc", "Total"];
  const colXs = [marginX, marginX + 60, marginX + 110, marginX + 320, marginX + 360, marginX + 420, marginX + 480];
  headers.forEach((header, index) => drawText(header, colXs[index], cursorY, 9, true));
  cursorY -= 12;

  for (const item of pedido.pedido_itens ?? []) {
    if (cursorY < 120) {
      page = pdf.addPage([595, 842]);
      cursorY = 800;
    }

    const produto = item.produtos;
    const imageData = await fetchImageBytes(produto?.imagem_url);

    if (imageData) {
      try {
        const image = imageData.contentType.includes("png")
          ? await pdf.embedPng(imageData.buffer)
          : await pdf.embedJpg(imageData.buffer);
        page.drawImage(image, {
          x: colXs[0],
          y: cursorY - 8,
          width: 32,
          height: 32,
        });
      } catch {
        drawText("-", colXs[0], cursorY, 9);
      }
    } else {
      drawText("-", colXs[0], cursorY, 9);
    }

    drawText(String(produto?.codigo ?? ""), colXs[1], cursorY + 8, 9);
    drawText(String(produto?.descricao ?? ""), colXs[2], cursorY + 8, 9);
    drawText(String(item.quantidade), colXs[3], cursorY + 8, 9);
    drawText(formatCurrency(Number(item.valor_unitario)), colXs[4], cursorY + 8, 9);
    drawText(formatCurrency(Number(item.desconto)), colXs[5], cursorY + 8, 9);
    drawText(formatCurrency(Number(item.total)), colXs[6], cursorY + 8, 9);

    cursorY -= 36;
  }

  cursorY -= 8;
  drawText("Totais", marginX, cursorY, 12, true);
  cursorY -= 16;
  drawText(`Total bruto: ${formatCurrency(Number(pedido.total_bruto))}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`Desconto: ${formatCurrency(Number(pedido.desconto_total))}`, marginX, cursorY, 10);
  cursorY -= 14;
  drawText(`Total líquido: ${formatCurrency(Number(pedido.total_liquido))}`, marginX, cursorY, 10);
  cursorY -= 20;

  drawText("Financeiro", marginX, cursorY, 12, true);
  cursorY -= 14;
  const conta = Array.isArray(pedido.contas_receber) ? pedido.contas_receber[0] : pedido.contas_receber;
  if (conta) {
    drawText(`Status: ${conta.status}`, marginX, cursorY, 10);
    cursorY -= 14;
    drawText(`Saldo: ${formatCurrency(Number(conta.saldo))}`, marginX, cursorY, 10);
    cursorY -= 14;
  }

  drawText("Pagamentos", marginX, cursorY, 12, true);
  cursorY -= 14;
  for (const pagamento of pedido.pagamentos ?? []) {
    drawText(
      `${pagamento.forma} - ${formatCurrency(Number(pagamento.valor_pago))} - ${pagamento.status}`,
      marginX,
      cursorY,
      9
    );
    cursorY -= 12;
  }

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=pedido-${pedido.id}.pdf`,
    },
  });
}
