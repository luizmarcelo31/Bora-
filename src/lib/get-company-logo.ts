import { prisma } from "@/lib/db";

/**
 * URL pública do logo da empresa, para as telas que geram PDF (Fase 3.3).
 *
 * ## Por que prop e não context
 *
 * `ReportActions` é Client Component e o PDF é montado no browser. Levar o
 * dado por prop é o que o componente já faz com `title`, `columns` e `rows` —
 * e cada tela que o usa é Server Component, então o dado já está no alcance.
 * Um context exigiria um provider no shell e re-render de tudo que embaixo dele
 * quando o logo mudasse, para um dado que muda uma vez por configuração.
 *
 * ## Por que uma função e não um select em cada página
 *
 * Cinco telas precisam do mesmo campo. Uma query indexada por primary key em
 * cada uma é irrelevante em custo, mas cinco cópias do mesmo `findUnique` é
 * cinco lugares para lembrar de filtrar por tenant.
 *
 * Devolve `null` quando não há logo — e também quando a linha de settings não
 * existe, que é o caso de toda loja que nunca abriu Configurações.
 */
export async function getCompanyLogoUrl(tenantId: number): Promise<string | null> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { companyLogoUrl: true },
  });

  return settings?.companyLogoUrl ?? null;
}
