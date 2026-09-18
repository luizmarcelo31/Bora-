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

## Depois de codar (obrigatório — parte do "done", sem exceção)
Ordem: código → testes → docs → commit. Nenhuma tarefa está concluída sem docs.
Checklist de docs por lote entregue:
1. `docs/changes/YYYY-MM-DD-<tarefa>.md` — o que mudou, por quê, arquivos, testes, riscos.
2. `docs/PROJECT_STATE.md` — data em "Atualizado", fase, recursos, pendings, bugs conhecidos.
3. `docs/ROADMAP.md` — marcar checkboxes concluídos; mover próximos.
4. Decisão estrutural → `docs/decisions/ADR-*.md` (nunca mudar ADR em silêncio).
Proibido commitar lote com docs desatualizados.

## Commits (regra permanente)
- Todo commit é autorado pelo proprietário: **Luiz Marcelo <luizmarcelo31@gmail.com>**.
- Identidade gravada no config LOCAL do repo (`.git/config`); nunca usar outra
  identidade nem alterar o config global.
- Nunca commitar segredos (`.env*`, senhas, chaves).
