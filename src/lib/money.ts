import { reaisToCents } from "@/lib/validators";

/** "12,99" / "12.99" / "12" → centavos. undefined se inválido. */
export function parseBRLToCents(raw: FormDataEntryValue | null): number | undefined {
  if (raw === null) return undefined;
  const normalized = String(raw).replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return reaisToCents(value);
}
