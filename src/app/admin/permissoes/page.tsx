import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["OWNER", "MANAGER", "FINANCIAL", "STOCK", "CASHIER", "STAFF"];

const ALL_PERMS = Array.from(
  new Set<Permission>(Object.values(ROLE_PERMISSIONS).flat())
).sort();

export default async function PermissoesPage() {
  await requireSuperAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Permissões"
        description="Matriz role × permissão (somente leitura — definida em src/lib/permissions.ts)."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permissão</TableHead>
            {ROLES.map((r) => (
              <TableHead key={r}>{r}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALL_PERMS.map((perm) => (
            <TableRow key={perm}>
              <TableCell>{perm}</TableCell>
              {ROLES.map((r) => (
                <TableCell key={r}>{ROLE_PERMISSIONS[r].includes(perm) ? "✅" : "—"}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
