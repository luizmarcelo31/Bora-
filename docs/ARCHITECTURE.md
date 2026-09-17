# ARCHITECTURE

Monólito modular em Next.js 16 (App Router). Sem backend separado.

```
UI (Server/Client Components)
 ↓
Server Actions / Route Handlers  →  Zod valida
 ↓
Services (src/services)          →  regra de negócio + tenant + permissão
 ↓
Prisma → PostgreSQL (Supabase)
```

- **Frontend:** React + Tailwind v4 + shadcn/ui (New York) + Lucide.
- **Backend:** Route Handlers (`src/app/api/*`) + Server Actions (`src/app/(auth)/actions.ts`).
- **Auth:** Supabase Auth (SSR). Sessão atualizada no `src/proxy.ts` (Next 16 renomeou middleware → proxy).
- **Contexto:** `src/lib/auth.ts`, `tenant.ts`, `roles.ts`, `permissions.ts`.
- **Validação:** Zod em `src/lib/validators.ts`.
- **Mídia:** Supabase Storage no MVP (ImageKit adiado — ver decisions/ADR-002).

## Convenções
- Route Handlers retornam `NextResponse.json`; erros de negócio → 400, falhas → 500.
- Services lançam `ValidationError`; nunca confiam no frontend.
- `tenantId` vem do header `X-Tenant-Id` na fase fundação; será derivado da sessão (ver TENANCY.md).
