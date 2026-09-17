# TENANCY

- **Tenant = empresa.** `tenant.type = CONVENIENCE` (v1). Tipos futuros: RESTAURANT, RETAIL, SERVICE.
- **Tenant ≠ usuário:** um tenant tem N usuários (`User.tenantId`).
- **Isolamento:** toda query operacional filtra `tenantId`; Services verificam ownership antes de update/delete.
- **Resolução atual:** sessão→tenant via `requireApiContext()` (`src/lib/api-context.ts`).
  Tenant derivado do vínculo do usuário; header `X-Tenant-Id` só vale para
  SUPER_ADMIN operando sobre um tenant. APIs sem sessão → 401.
- **Super Admin:** nível plataforma. Como `User.tenantId` é obrigatório no
  schema, o super admin vincula-se a um tenant `type = "PLATFORM"`
  ("BoraMais Plataforma"), criado pelo `scripts/bootstrap-admin.cjs`.
