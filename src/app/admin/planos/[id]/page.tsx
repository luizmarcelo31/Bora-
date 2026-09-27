import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { salvarPlanoAction } from "../actions";

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const planoId = Number(id);
  if (!Number.isInteger(planoId) || planoId <= 0) notFound();

  const plano = await prisma.plan.findUnique({ where: { id: planoId } });
  if (!plano) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title={`Editar ${plano.name}`}
        badge="Receita"
        description="Preços em reais. Empresas já assinadas mantêm o valor que contrataram."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/planos">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <form action={salvarPlanoAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={plano.id} />
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required defaultValue={plano.name} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preço mensal (R$)*
              <Input
                name="monthlyPrice"
                required
                type="number"
                step="0.01"
                min="0"
                defaultValue={(plano.monthlyPrice / 100).toFixed(2)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preço anual (R$)
              <Input
                name="annualPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plano.annualPrice ? (plano.annualPrice / 100).toFixed(2) : ""}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Limite de usuários
              <Input name="maxUsers" type="number" min="1" defaultValue={plano.maxUsers ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Limite de produtos
              <Input name="maxProducts" type="number" min="1" defaultValue={plano.maxProducts ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Limite de vendas por mês
              <Input
                name="maxSalesPerMonth"
                type="number"
                min="1"
                defaultValue={plano.maxSalesPerMonth ?? ""}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Dias de experimentação
              <Input name="trialDays" type="number" min="0" max="365" defaultValue={plano.trialDays} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Recursos (um por linha)
              <textarea
                name="features"
                rows={5}
                defaultValue={plano.features.join("\n")}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Salvar plano</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
