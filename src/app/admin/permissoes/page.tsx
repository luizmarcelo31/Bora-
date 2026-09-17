import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["OWNER", "MANAGER", "FINANCIAL", "STOCK", "CASHIER", "STAFF"];

const ALL_PERMS = Array.from(
  new Set<Permission>(Object.values(ROLE_PERMISSIONS).flat())
).sort();

export default async function PermissoesPage() {
  await requireSuperAdmin();

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Permissões"
        description="Matriz role × permissão (somente leitura — definida em src/lib/permissions.ts)."
      />
      <Table>
        <THead>
          <TR>
            <TH>Permissão</TH>
            {ROLES.map((r) => (
              <TH key={r}>{r}</TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {ALL_PERMS.map((perm) => (
            <TR key={perm}>
              <TD>{perm}</TD>
              {ROLES.map((r) => (
                <TD key={r}>{ROLE_PERMISSIONS[r].includes(perm) ? "✅" : "—"}</TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </main>
  );
}
