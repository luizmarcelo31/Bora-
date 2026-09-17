# 2026-09-17 — Fase A: Super Admin funcional (visual atual)

## O que mudou
- **A1:** `src/lib/api-context.ts` (`requireApiContext` + `toApiError`).
  Todas as APIs exigem sessão Supabase + vínculo ativo; tenant derivado do
  vínculo (header `X-Tenant-Id` só para SUPER_ADMIN). Sem sessão → 401.
  `POST /api/tenants` restrito a SUPER_ADMIN; `GET` retorna só o próprio
  tenant para usuário comum.
- **A2:** `src/lib/admin.ts` (`requireSuperAdmin`) + `src/app/unauthorized/page.tsx`.
- **A3:** área `/admin` — `layout.tsx` (nav + logout), `actions.ts`
  (`createTenantAction`, `createUserAction`), `page.tsx` (métricas),
  `empresas`, `usuarios`, `permissoes` (matriz real do `ROLE_PERMISSIONS`).
- **A4:** proxy já cobria `/admin` (sessão obrigatória); role verificada nas
  páginas. Bootstrap: `scripts/bootstrap-admin.cjs <email> <nome>` cria o
  tenant `PLATFORM` + usuário SUPER_ADMIN (testado e revertido no banco real).
- Correção: grupo `(admin)` não gera prefixo de URL → pasta real `admin/`.

## Arquivos principais
`src/lib/api-context.ts`, `src/lib/admin.ts`, `src/app/api/*/route.ts`,
`src/app/admin/**`, `src/app/unauthorized/page.tsx`,
`scripts/bootstrap-admin.cjs`, `docs/{TENANCY,MODULES,PROJECT_STATE}.md`.

## Testes (Gate A)
- `npx next build --webpack` verde (19 rotas: /admin* presentes).
- Runtime: `/api/products`, `/api/tenants`, `/api/users` sem sessão → 401;
  `/admin` e `/admin/usuarios` sem sessão → 307 (login).
- Bootstrap executado contra Supabase real e revertido
  (banco voltou a tenants:1, users:0, products:1).

## Roteiro manual pendente (exige conta Supabase real no browser)
1. `node scripts/bootstrap-admin.cjs <seu-email> <nome>` (após /signup com o mesmo email).
2. Login → /admin → criar empresa → criar usuário → /unauthorized com conta não-admin.

## Efeitos colaterais
- Clientes das APIs precisam enviar sessão (cookies Supabase); `tenantId` por
  query/header não tem mais efeito para usuário comum.
- `GET /api/products` não aceita mais `?tenantId` de terceiros (ignorado).
