# AI_RULES

Regras obrigatórias para qualquer IA operando neste repo.

## Antes de codar (ordem mínima)
1. `docs/AI_RULES.md` (este arquivo)
2. `docs/PROJECT_STATE.md`
3. `docs/PRD.md`
4. Doc do módulo (`AUTH.md`, `TENANCY.md`, `PERMISSIONS.md`, `DATABASE.md`...)
5. Código existente → só então implementar.

## Stack travada
Next.js 16 App Router · Prisma · Supabase (Auth + Postgres) · Zod · Tailwind + shadcn.
**Next 16: usar `src/proxy.ts` (não `middleware.ts` — depreciado).**

## Leis
- Simplicidade primeiro (sem microsserviços/filas/Redis sem necessidade provada).
- `tenantId` em toda query operacional; autorização no servidor (`requirePermission`).
- Valores em centavos; estoque só via movimentação em transação.
- Validar entradas com Zod; nunca expor secrets; nunca confiar no frontend.
- Não misturar escopos: uma tarefa = um módulo. Problema fora do escopo: registrar, não refatorar junto.
- Bug: reproduzir → isolar → teste → corrigir → regressão → documentar.

## Depois de codar
Código → testes → docs → `docs/changes/YYYY-MM-DD-<tarefa>.md` → atualizar `PROJECT_STATE.md`.
Decisão estrutural → `docs/decisions/ADR-*.md` (nunca mudar ADR em silêncio).
