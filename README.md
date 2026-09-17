# BoraMais — SaaS de Gestão para Conveniências

Monólito modular em **Next.js 16 + Prisma + Supabase + Zod + shadcn/ui**. Estado atual: **fundação pronta** (ver `docs/PROJECT_STATE.md`).

## Comece aqui (ordem de leitura)
1. `docs/AI_RULES.md` → 2. `docs/PROJECT_STATE.md` → 3. `docs/PRD.md` → 4. doc do módulo → 5. código.

## Setup local
```bash
npm install
cp .env.example .env.local   # preencha [YOUR-PASSWORD] e as chaves Supabase
npx prisma migrate dev       # sobe o schema no Postgres (Supabase)
npx prisma generate
npm run dev                  # http://localhost:3000
```

## Teste rápido
- `GET /api/test` → `{ success: true, tenantCount }`
- `POST /api/tenants` → `{ "name": "Conveniência Centro", "type": "CONVENIENCE" }`
- `POST /api/products` (header `X-Tenant-Id: 1`) → cria produto + estoque
- `/login`, `/signup`, `/dashboard` → Auth Supabase

## Deploy na Vercel
1. Suba o repo no GitHub e importe na Vercel.
2. Configure as envs (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DIRECT_URL`).
3. Deploy — `npm run build` deve passar sem erros.

## Estrutura
```
src/app/api/*        → Route Handlers (test, tenants, products, users, sales, stock, cashbox, financial)
src/app/(auth)       → Server Actions login/signup/logout
src/lib              → db, validators, supabase/*, auth, tenant, roles, permissions, utils
src/services         → regras de negócio (product, inventory, sale, cashbox, financial)
src/components       → ui/* + shared/*
prisma               → schema + migrations
docs                 → PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, PROJECT_STATE, AI_RULES, decisions/, changes/
```
