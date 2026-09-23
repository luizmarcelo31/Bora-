import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Building2, Users, Package, ShoppingCart } from "lucide-react";

export default async function AdminHomePage() {
  await requireSuperAdmin();

  const [tenants, users, products, sales] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.sale.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Visão geral da plataforma"
        badge="Plataforma"
        description="Empresas, usuários e vendas de todos os tenants."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Empresas" value={String(tenants)} hint="Tenants ativos na plataforma" icon={Building2} />
        <MetricCard title="Usuários" value={String(users)} hint="Todas as roles, todos os tenants" icon={Users} />
        <MetricCard title="Produtos" value={String(products)} hint="Catálogo somado da plataforma" icon={Package} />
        <MetricCard title="Vendas" value={String(sales)} hint="Concluídas (todos os tenants)" icon={ShoppingCart} />
      </div>
    </main>
  );
}
