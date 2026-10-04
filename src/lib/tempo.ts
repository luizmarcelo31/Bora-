/**
 * "Há 2 dias" — o formato curto para dizer *quando*, nunca *quanto*.
 *
 * Nas telas de plataforma, o que interessa é o tempo desde o último uso. Não o
 * número de vendas: esse é dado do cliente, e a plataforma não precisa dele para
 * saber se o produto está vivo. Ver `docs/PRIVACIDADE-PLATAFORMA.md`.
 */
export function dataRelativaCurta(d: Date | null | undefined): string {
  if (!d) return "nunca";

  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000);

  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) {
    const semanas = Math.floor(dias / 7);
    return `há ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
  }
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
  }
  const anos = Math.floor(dias / 365);
  return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
}

/** Versão com "Nunca" para quando o campo ainda não foi escrito. */
export function dataRelativa(d: Date | null | undefined): string {
  if (!d) return "Nunca";
  const r = dataRelativaCurta(d);
  return r.charAt(0).toUpperCase() + r.slice(1);
}