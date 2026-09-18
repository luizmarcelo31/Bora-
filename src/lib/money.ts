import { reaisToCents } from "@/lib/validators";

/**
 * "12,99" / "12" → centavos (1299 / 1200). undefined se inválido.
 * Ponto é sempre separador de milhar ("1.000,50" → 100050); não use ponto
 * como decimal ("12.99" vira 129900). Padrão BR: vírgula decimal.
 */
export function parseBRLToCents(raw: FormDataEntryValue | null): number | undefined {
  if (raw === null) return undefined;
  const normalized = String(raw).replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return reaisToCents(value);
}
