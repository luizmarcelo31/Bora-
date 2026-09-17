# ADR-003 — Proxy no Next 16 (middleware depreciado)

**Data:** 17/09/2026 · **Status:** Aceita

## Contexto
Next 16 renomeou `middleware.ts` → `proxy.ts` (`export function proxy`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).

## Decisão
Sessão Supabase e guardas de rota vivem em `src/proxy.ts`. Não criar `middleware.ts`.

## Consequências
- Matcher exclui `_next/static`, `_next/image`, `favicon.ico` e assets.
- `/api/*` passa direto; authz por rota.
