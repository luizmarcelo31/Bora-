# PERMISSIONS

Roles (nível tenant): `OWNER > MANAGER > FINANCIAL > STOCK > CASHIER > STAFF`.
`SUPER_ADMIN` é nível plataforma.

Matriz em `src/lib/permissions.ts` (`ROLE_PERMISSIONS` + `can()` + `requirePermission()`).
Hierarquia numérica em `src/lib/roles.ts` (`hasMinRole()`).

| Capacidade | OWNER | MANAGER | FINANCIAL | STOCK | CASHIER | STAFF |
|---|---|---|---|---|---|---|
| products create/update/delete | ✅/✅/✅ | ✅/✅/— | — | ✅/✅/— | view | view |
| inventory move | ✅ | ✅ | — | ✅ | — | — |
| sales create/cancel | ✅/✅ | ✅/✅ | view | — | ✅/— | view |
| cashbox open/close | ✅/✅ | ✅/✅ | — | — | view | — |
| financial create | ✅ | view | ✅ | — | — | — |
| users manage | ✅ | view | — | — | — | — |

Regra: autorização sempre no servidor (Services/Route Handlers). Frontend só esconde UI.
