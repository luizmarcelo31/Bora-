# 2026-09-17 — Fundação completa

## O que mudou
- Config: `clsx`/`tailwind-merge`/`cva`, `.env.example`, supabase clients, `utils.ts`.
- Contexto: `auth.ts`, `tenant.ts`, `roles.ts`, `permissions.ts`, `src/proxy.ts` (Next 16).
- Design System: `components.json`, tokens em `globals.css`, `ui/` (5) + `shared/` (3), layout/home pt-BR.
- Auth: actions `login/signup/logout` + páginas `/login`, `/signup`, `/dashboard`.
- APIs: `users`, `sales`, `stock`, `cashbox`, `cashbox/[id]/close`, `financial`.
- Docs: 11 arquivos contínuos + ADR-001/002/003.

## Arquivos principais
`src/lib/*`, `src/proxy.ts`, `src/components/**`, `src/app/(auth)/actions.ts`,
`src/app/login|signup|dashboard/page.tsx`, `src/app/api/{users,sales,stock,cashbox,financial}/route.ts`, `docs/*`.

## Testes
- Pendente: `npx prisma generate`, `npm run build`, POST/GET manual (ver SETUP_PRATICO).

## Efeitos colaterais
- `X-Tenant-Id` ainda manual nas APIs (amarração com sessão é a próxima tarefa).
- Sem UIs comerciais ainda.
