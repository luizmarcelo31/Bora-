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
};

const TH: React.CSSProperties = {
  border: "1px solid #999",
  padding: "4px 6px",
  background: "#eee",
  textAlign: "left",
};
const TD: React.CSSProperties = { border: "1px solid #999", padding: "4px 6px" };

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

  function buildPdf() {
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 23);
      doc.setTextColor(0);
    }
    autoTable(doc, {
      head: [columns],
      body: rows,
      foot: footer ? [footer] : undefined,
      startY: subtitle ? 28 : 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
      footStyles: { fillColor: [244, 244, 245], textColor: [24, 24, 27], fontStyle: "bold" },
    });
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(120);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")} — Página ${i}/${pageCount}`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
    return doc;
  }

  function handleExport() {
    try {
      buildPdf().save(`${fileName}.pdf`);
      toast.success("PDF exportado.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }

  async function handleShare() {
    try {
      const blob = buildPdf().output("blob");
      const file = new File([blob], `${fileName}.pdf`, { type: "application/pdf" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: subtitle });
        return;
      }
      buildPdf().save(`${fileName}.pdf`);
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
              style={{ padding: "12mm", color: "#000", background: "#fff", fontFamily: "Arial, sans-serif" }}
            >
              <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>{title}</h1>
              {subtitle ? <p style={{ fontSize: 11, color: "#555", margin: "0 0 12px" }}>{subtitle}</p> : null}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
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
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) => (
                        <td key={j} style={TD}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
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
              <p style={{ fontSize: 10, color: "#555" }}>Gerado em {new Date().toLocaleString("pt-BR")}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
