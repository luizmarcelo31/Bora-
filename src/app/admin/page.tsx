import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";

export default async function AdminHomePage() {
  await requireSuperAdmin();

  const [tenants, users, products, sales] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.sale.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral da plataforma"
        badge="Plataforma"
        description="Empresas, usuários e vendas de todos os tenants."
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard title="Empresas" value={String(tenants)} />
        <MetricCard title="Usuários" value={String(users)} />
        <MetricCard title="Produtos" value={String(products)} />
        <MetricCard title="Vendas" value={String(sales)} />
      </div>
    </main>
  );
}
