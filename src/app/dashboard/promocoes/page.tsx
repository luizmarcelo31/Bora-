import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableCard } from "@/components/shared/TableCard";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Tag } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { createPromotionAction, togglePromotionAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique os campos.",
  not_found: "Promoção não encontrada.",
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function PromocoesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; q?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/promocoes");
  const params = await searchParams;

  const [promotions, products] = await Promise.all([
    prisma.promotion.findMany({
      where: { tenantId: tenant.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Promoções"
        badge={tenant.name}
        description="Gerencie regras de descontos, combos e atacado."
      />
      <SearchParamToast okText="Ação realizada com sucesso." errorMap={ERROR_MSG} />

      <Card>
        <CardHeader>
          <CardTitle>Nova promoção</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPromotionAction} className="grid gap-3 sm:grid-cols-4 items-end">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Ex: Black Friday 10%" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <SelectField
                name="type"
                defaultValue="PERCENTAGE"
                options={[
                  { value: "PERCENTAGE", label: "Percentual (%)" },
                  { value: "FIXED_AMOUNT", label: "Valor Fixo (R$)" },
                  { value: "COMBO", label: "Combo" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valor*
              <Input name="value" required inputMode="numeric" placeholder="10" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Produtos Inclusos
              <select name="productIds" multiple className="flex h-20 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">Segure Ctrl/Cmd para selecionar vários</span>
            </label>
            <div className="sm:col-span-4 mt-2">
              <Button type="submit">Criar promoção</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {promotions.length === 0 ? (
        <EmptyState title="Nenhuma promoção" description="Crie a sua primeira promoção acima." icon={Tag} />
      ) : (
        <TableCard
          title="Lista de Promoções"
          description="Promoções cadastradas."
          footer={`${promotions.length} promoção(ões)`}
        >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((p) => {
              const valueFormatted = p.type === "FIXED_AMOUNT" ? formatCurrency(p.value) : p.type === "PERCENTAGE" ? `${p.value}%` : p.value;
              return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.type}</TableCell>
                <TableCell className="tabular-nums">{valueFormatted}</TableCell>
                <TableCell>{p.items.length} produto(s)</TableCell>
                <TableCell>
                  <StatusBadge status={p.active ? "active" : "inactive"} />
                </TableCell>
                <TableCell>
                  <form action={togglePromotionAction}>
                    <input type="hidden" name="promotionId" value={p.id} />
                    <Button variant="outline" size="sm" type="submit">
                      {p.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </TableCard>
      )}
    </main>
  );
}
