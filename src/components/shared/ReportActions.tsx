"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { Printer, FileDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReportActionsProps = {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
  footer?: string[];
  fileName: string;
  orientation?: "portrait" | "landscape";
  /**
   * Logo da loja, vinda de `TenantSettings.companyLogoUrl` (Fase 3.3).
   *
   * Prop, e não fetch: o PDF é gerado no browser e o `companyLogoUrl` já está
   * no registro porque a página é Server Component. Buscar aqui seria uma
   * chamada a mais por export, para dado que a tela acabou de ler.
   */
  companyLogoUrl?: string | null;
};

/** Altura da logo no PDF, em mm. ~70 px: legível no A4 e compacta. */
const LOGO_ALTURA_MM = 25;

/** Margem esquerda do documento, igual ao `x` do título. */
const MARGEM_MM = 14;

const TH: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: "4px 6px",
  background: "#f8fafc",
  textAlign: "left",
};
const TD: React.CSSProperties = { border: "1px solid #cbd5e1", padding: "4px 6px" };

/**
 * Carrega a logo como data URL.
 *
 * `jsPDF.addImage` não aceita URL: precisa dos bytes. Então busca e converte.
 *
 * Falhar aqui não pode derrubar o export: o relatório é o que o gerente
 * precisa, a logo é enfeite. Perder o PDF por causa de um PNG quebrado seria um
 * bug, não uma degradação.
 */
async function carregarLogo(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise<string | null>((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => resolve(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    // CORS, DNS, modo avião: qualquer um destes é "sem logo", não "sem PDF".
    return null;
  }
}

/**
 * Proporção largura/altura a partir dos bytes do PNG.
 *
 * `addImage` com largura e altura fixos estica a imagem. Só dá para corrigir a
 * proporção em PNG — o data URL de JPEG não carrega as dimensões — e aí o
 * jsPDF assume a proporção quando recebe só a altura.
 */
function proporcaoNatural(dataUrl: string): number | null {
  if (!dataUrl.startsWith("data:image/png;base64,")) return null;
  try {
    const bin = atob(dataUrl.slice("data:image/png;base64,".length).slice(0, 64));
    // IHDR do PNG: largura e altura são 4 bytes big-endian a partir do offset 16.
    // `atob` devolve string, então cada caractere é um byte.
    const w =
      (bin.charCodeAt(16) << 24) | (bin.charCodeAt(17) << 16) | (bin.charCodeAt(18) << 8) | bin.charCodeAt(19);
    const h =
      (bin.charCodeAt(20) << 24) | (bin.charCodeAt(21) << 16) | (bin.charCodeAt(22) << 8) | bin.charCodeAt(23);
    return w > 0 && h > 0 ? w / h : null;
  } catch {
    return null;
  }
}

/** Cor semântica para valores de pagamento no PDF. */
function paymentColor(method: string): [number, number, number] | null {
  const m = method.toLowerCase();
  if (m.includes("pix") || m.includes("dinheiro")) return [5, 150, 105];
  if (m.includes("cartão") || m.includes("credit") || m.includes("debit")) return [37, 99, 235];
  return null;
}

/** Cor semântica para tipo financeiro no PDF. */
function financialTypeColor(type: string): [number, number, number] | null {
  if (type === "RECEITA") return [5, 150, 105];
  if (type === "DESPESA") return [220, 38, 38];
  if (type === "TRANSFERENCIA") return [37, 99, 235];
  return null;
}

/** Cor semântica para situação de estoque no PDF. */
function stockStatusColor(status: string): [number, number, number] | null {
  if (status === "Baixo") return [220, 38, 38];
  if (status === "Ok") return [5, 150, 105];
  return null;
}

/** Cor semântica para ação de auditoria no PDF. */
function auditActionColor(action: string): [number, number, number] | null {
  if (action === "CREATE") return [5, 150, 105];
  if (action === "UPDATE") return [37, 99, 235];
  if (action === "DELETE") return [220, 38, 38];
  return null;
}

/** Largura que preserva a proporção, para não distorcer a logo. */
function larguraDaLogo(dataUrl: string, alturaMm: number): number {
  const proporcao = proporcaoNatural(dataUrl);
  return proporcao ? alturaMm * proporcao : alturaMm;
}

/**
 * Ações de relatório por tipo (LOG / VENDAS / FINANCEIRO / ESTOQUE):
 * - Visualizar: monta data-print-root e chama window.print() (destino PDF no desktop)
 * - Exportar PDF: gera PDF via jspdf-autotable e baixa
 * - Compartilhar: Web Share API com o PDF (mobile: WhatsApp, Gmail...) + fallback download
 */
export function ReportActions({
  title,
  subtitle,
  columns,
  rows,
  footer,
  fileName,
  orientation = "portrait",
  companyLogoUrl,
}: ReportActionsProps) {
  const [printing, setPrinting] = useState(false);
  const empty = rows.length === 0;

  useEffect(() => {
    if (!printing) return;
    const t = requestAnimationFrame(() => window.print());
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  async function buildPdf(): Promise<jsPDF> {
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    doc.setProperties({ title, subject: subtitle, author: "BoraMais" });

    const logo = companyLogoUrl ? await carregarLogo(companyLogoUrl) : null;
    let alturaLogo = LOGO_ALTURA_MM;

    if (logo) {
      try {
        doc.addImage(
          logo,
          logo.startsWith("data:image/png") ? "PNG" : "JPEG",
          MARGEM_MM,
          8,
          larguraDaLogo(logo, alturaLogo),
          alturaLogo
        );
      } catch {
        alturaLogo = LOGO_ALTURA_MM;
      }
    }

    const yTitulo = alturaLogo > 0 ? 8 + alturaLogo + 8 : 16;
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.text(title, MARGEM_MM, yTitulo);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, MARGEM_MM, yTitulo + 7);
    }
    doc.setTextColor(24, 24, 27);

    if (rows.length === 0) {
      doc.setFontSize(10);
      doc.text("Sem dados para este período.", MARGEM_MM, yTitulo + 14);
    } else {
      autoTable(doc, {
        head: [columns],
        body: rows.map((r) =>
          r.map((cell, ci) => {
            const colName = (columns[ci] || "").toLowerCase();
            let color: [number, number, number] | null = null;
            const cellStr = String(cell).toLowerCase();
            if (colName.includes("pagamento") || colName.includes("tipo")) {
              color = paymentColor(cellStr);
            } else if (colName === "situação") {
              color = stockStatusColor(cellStr);
            } else if (colName === "ação" || colName === "a\\\\u00e7\\\\u00e3o") {
              color = auditActionColor(cellStr.toUpperCase());
            } else if (colName === "pago") {
              color = cellStr === "pago" ? [5, 150, 105] : [220, 38, 38];
            }
            return color ? { content: cell, styles: { textColor: color } } : cell;
          })
        ),
        foot: footer ? [footer] : undefined,
        startY: subtitle ? yTitulo + 12 : yTitulo + 6,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [24, 24, 27] },
        footStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: "bold" },
        didParseCell: (info) => {
          if (info.section === "foot" && info.column.index === 1 && footer && footer.length > 1) {
            info.cell.styles.fillColor = [248, 250, 252];
            info.cell.styles.textColor = [220, 38, 38];
            info.cell.styles.fontStyle = "bold";
          }
        },
      });
    }

    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(120);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} — Página ${i}/${pageCount}`,
        MARGEM_MM,
        doc.internal.pageSize.height - 8
      );
    }
    return doc;
  }

  async function handleExport() {
    try {
      const doc = await buildPdf();
      doc.save(`${fileName}.pdf`);
      toast.success("PDF exportado.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }

  async function handleShare() {
    try {
      const doc = await buildPdf();
      const blob = doc.output("blob");
      const file = new File([blob], `${fileName}.pdf`, { type: "application/pdf" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: subtitle });
        return;
      }
      doc.save(`${fileName}.pdf`);
      toast.info("Compartilhamento indisponível — PDF baixado.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Não foi possível compartilhar.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={empty} onClick={() => setPrinting(true)}>
          <Printer className="size-4" /> Visualizar
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={empty} onClick={handleExport}>
          <FileDown className="size-4" /> Exportar PDF
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={empty} onClick={handleShare}>
          <Share2 className="size-4" /> Compartilhar
        </Button>
      </div>
      {printing &&
        typeof document !== "undefined" &&
        createPortal(
          <div data-print-root>
            <div
              data-print-paper
              style={{ padding: "12mm", color: "#000", background: "#fff", fontFamily: "Helvetica, sans-serif" }}
            >
              {/* A logo precisa estar DENTRO de data-print-root: o `@media print`
                  em globals.css esconde tudo que está fora dele. Logo fora daqui
                  não aparece na impressão. */}
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt=""
                  style={{ height: "25mm", width: "auto", objectFit: "contain", display: "block", margin: "0 0 6px" }}
                />
              ) : null}
              <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>{title}</h1>
              {subtitle ? <p style={{ fontSize: 11, color: "#555", margin: "0 0 12px" }}>{subtitle}</p> : null}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Helvetica, sans-serif" }}>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c} style={TH}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ ...TD, textAlign: "center", color: "#64748b" }}>
                        Sem dados para este período.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((cell, j) => (
                          <td key={j} style={TD}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
                {footer ? (
                  <tfoot>
                    <tr>
                      {footer.map((cell, j) => (
                        <td key={j} style={{ ...TD, fontWeight: "bold" }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
              <p style={{ fontSize: 10, color: "#555" }}>
                Gerado em {new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} — Página 1
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
