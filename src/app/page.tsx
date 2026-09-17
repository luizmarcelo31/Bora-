import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const foundation = [
  { label: "Next.js + TypeScript", done: true },
  { label: "Tailwind + Design System", done: true },
  { label: "Supabase conectado", done: true },
  { label: "PostgreSQL + Prisma", done: true },
  { label: "Supabase Auth", done: true },
  { label: "Tenant + Roles", done: true },
  { label: "Super Admin", done: false },
  { label: "Primeiro módulo comercial", done: false },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <PageHeader
        title="BoraMais"
        badge="Fundação"
        description="SaaS de gestão para conveniências — produtos, estoque, PDV, caixa e financeiro."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Módulos core" value="5" hint="Auth, tenants, users, roles, permissões" />
        <MetricCard title="APIs ativas" value="7" hint="/api/test, tenants, products, users, sales..." />
        <MetricCard title="Banco" value="Prisma" hint="PostgreSQL no Supabase" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado da fundação</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {foundation.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <span aria-hidden>{item.done ? "✅" : "⬜"}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link className={buttonVariants()} href="/login">
          Entrar
        </Link>
        <Link className={buttonVariants({ variant: "outline" })} href="/signup">
          Criar conta
        </Link>
        <Link className={buttonVariants({ variant: "ghost" })} href="/api/test">
          Testar API /api/test
        </Link>
      </div>
    </main>
  );
}
