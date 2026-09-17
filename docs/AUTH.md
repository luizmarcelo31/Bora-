# AUTH

- **Provedor:** Supabase Auth (email/senha).
- **Clientes:** `src/lib/supabase/client.ts` (browser) · `src/lib/supabase/server.ts` (server).
- **Sessão:** atualizada no `src/proxy.ts` (padrão @supabase/ssr). Páginas privadas (`/dashboard`, `/admin`, `/pdv`...) redirecionam para `/login?redirect=...`.
- **Actions:** `src/app/(auth)/actions.ts` — `login`, `signup`, `logout` (Server Actions, validam com Zod).
- **Páginas:** `/login`, `/signup`, `/dashboard` (privada, exemplo).
- **Ponte Auth → banco local:** `getUserContextByEmail()` em `src/lib/tenant.ts` (email do Supabase → `User` + `Tenant` no Prisma).
- **APIs:** ainda usam `X-Tenant-Id` na fundação; a amarração sessão→tenant é o próximo passo (ver ROADMAP.md).

## Env
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY legado)
```
