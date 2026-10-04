import { requireSuperAdmin } from "@/lib/admin";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { createTenantAction } from "@/app/admin/actions";
import { VOLTAR_EMPRESAS } from "../mensagens";
import { SEGMENTOS, formatCurrency } from "@/lib/validators";

/**
 * Cadastro de empresa em página própria, e não embutido na listagem.
 * Motivo: o formulário antigo empurrava a tabela para baixo e diluía a
 * ação principal. Criar é uma tarefa com começo, meio e fim — merece URL.
 *
 * ## Por que o plano aparece aqui
 *
 * Empresa sem assinatura é uma empresa que a plataforma não sabe cobrar. Criar
 * a empresa e o plano em passos separados abriu um buraco: a empresa existia
 * sem plano, e o admin não tinha caminho para anexar um depois. O plano virou
 * campo obrigatório deste formulário, e a assinatura nasce na mesma transação.
 *
 * ## Por que os limites aparecem no rótulo
 *
 * `maxUsers`, `maxProducts` e `maxSalesPerMonth` é o que o plano realmente
 * promete. Descobrir isso depois de vender é tarde: o cliente descobre o limite
 * quando o sistema barra a operação. O rótulo do plano mostra preço e os três
 * limites juntos, para a escolha ser informada antes do envio.
 */
export default async function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const planos = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
    select: {
      id: true,
      name: true,
      monthlyPrice: true,
      maxUsers: true,
      maxProducts: true,
      maxSalesPerMonth: true,
      trialDays: true,
    },
  });

  const limite = (v: number | null) => (v === null ? "sem limite" : String(v));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Nova empresa"
        badge="Plataforma"
        description="Cadastre a empresa e vincule o primeiro usuário a ela."
      />

      {planos.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm">
            <p className="font-semibold">Nenhum plano ativo cadastrado.</p>
            <p className="mt-1 text-muted-foreground">
              O plano é obrigatório porque é ele que define o que a empresa pode
              usar e quanto a plataforma cobra.{" "}
              <Link href="/admin/planos" className="underline">
                Cadastrar um plano
              </Link>{" "}
              primeiro.
            </p>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardContent>
          <form action={createTenantAction} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Conveniência Centro" />
            </label>

            {/* Segmento: lista fechada, não texto livre. Era um Input que
                aceitaria qualquer coisa — o validador rejeita, mas o admin só
                descobria depois de enviar. */}
            <label className="flex flex-col gap-1 text-sm">
              Segmento*
              <SelectField
                name="type"
                defaultValue="CONVENIENCE"
                required
                options={Object.entries(SEGMENTOS).map(([value, label]) => ({ value, label }))}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Plano*
              <SelectField
                name="planId"
                required
                placeholder="Selecione..."
                options={planos.map((p) => ({
                  value: String(p.id),
                  // Limites no rótulo: é o que o plano promete, e precisa
                  // estar visível na escolha.
                  label: [
                    p.name,
                    `${formatCurrency(p.monthlyPrice)}/mês`,
                    `${limite(p.maxUsers)} usuários`,
                    `${limite(p.maxProducts)} produtos`,
                    `${limite(p.maxSalesPerMonth)} vendas/mês`,
                  ].join(" · "),
                }))}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Email
              <Input name="email" type="email" placeholder="contato@empresa.com" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Telefone
              <Input name="phone" inputMode="numeric" placeholder="11999999999" />
            </label>

            {/* Trial: o plano sugere, o admin decide. É a alavanca comercial
                da plataforma e precisa estar na mão aqui. */}
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Dias de teste
              <Input
                name="trialDays"
                type="number"
                min={0}
                max={365}
                defaultValue={planos[0]?.trialDays ?? 14}
              />
              <span className="text-xs text-muted-foreground">
                A empresa entra em experimentação e só é cobrada quando o teste
                acaba. Use 0 para cobrar desde o primeiro dia.
              </span>
            </label>

            {params.error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {params.error === "plano"
                  ? "Plano inválido ou inativo. Escolha um plano ativo."
                  : VOLTAR_EMPRESAS.error.invalid}
              </p>
            ) : null}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Criar empresa</Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/empresas">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Os limites de cada plano, lado a lado. O seletor já mostra os números
          no rótulo; esta lista é para comparar antes de escolher, e no desktop
          cabe sem scroll. */}
      {planos.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-semibold">Limites de cada plano</p>
            <ul className="flex flex-col gap-2">
              {planos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-border bg-card p-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {limite(p.maxUsers)} usuários · {limite(p.maxProducts)} produtos ·{" "}
                      {limite(p.maxSalesPerMonth)} vendas/mês · {p.trialDays} dias de teste
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(p.monthlyPrice)}
                    <span className="text-xs font-normal text-muted-foreground">/mês</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
