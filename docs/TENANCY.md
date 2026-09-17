# TENANCY

- **Tenant = empresa.** `tenant.type = CONVENIENCE` (v1). Tipos futuros: RESTAURANT, RETAIL, SERVICE.
- **Tenant ≠ usuário:** um tenant tem N usuários (`User.tenantId`).
- **Isolamento:** toda query operacional filtra `tenantId`; Services verificam ownership antes de update/delete.
- **Resolução atual:** header `X-Tenant-Id` (fundação) via `getTenantIdFromHeaders()` + `requireTenant()`.
- **Evolução:** derivar `tenantId` da sessão (usuário→tenant) e remover header manual das APIs.
- **Super Admin:** nível plataforma, fora do tenant operacional.
