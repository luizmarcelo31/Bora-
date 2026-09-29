# AI_RULES

Regras obrigatórias para qualquer IA operando neste repo.

## Antes de codar (ordem mínima)
1. `docs/AI_RULES.md` (este arquivo)
2. `docs/PROJECT_STATE.md`
3. `docs/PRD.md`
4. Doc do módulo (`AUTH.md`, `TENANCY.md`, `PERMISSIONS.md`, `DATABASE.md`...)
5. Código existente → só então implementar.

## Banco, schema e migrations (leia antes de qualquer `prisma`)

O banco é **estado compartilhado e não volta atrás com o git**. Um clone
atrasado descreve um banco que já mudou, e o resultado é migration escrita
contra uma modelo obsoleto. Em 29/09/2026 isso custou uma migration que
tentou recriar tabelas (`Plan`, `Subscription`) que já existiam.

**Procedimento obrigatório antes de criar ou rodar migration:**

1. `git fetch origin` e conferir se `origin/main` está à frente do local.
   Roadmap e schema podem ter advances que o clone não tem.
2. `npx prisma migrate status` — confirma se a pasta de migrations bate com
   `_prisma_migrations`. Se aparecer migration no banco que não está na pasta
   (ou vice-versa), **pare**: o clone está desatualizado.
3. `node scripts/verificar-checksums.cjs` — detecta migration divergente.
   Divergência de checksum normalmente é `core.autocrlf` convertendo LF→CRLF,
   não edição humana. O `.gitattributes` deste repo já normaliza migrations
   em LF justamente para isso.

**Ao escrever migration:**

- Valores default de tabela e coluna vão **sem** aspas duplas.
- Nunca edite uma migration já aplicada: o Prisma guarda sha256 em
  `_prisma_migrations.checksum` e passa a acusar "modified after applied".
  Para corrigir bytes, use `node scripts/corrigir-migration-bom.cjs`, que
  imprime o SQL de rollback.

**Estado atual (29/09/2026) — armadilha conhecida:**

- `npx prisma migrate dev` **falha** (P1014: tabela `Promotion` não existe
  no shadow DB). 7 modelos não têm migration que crie a tabela: `Promotion`,
  `PromotionItem`, `Supplier`, `Purchase`, `PurchaseItem`, `InventoryCount`,
  `InventoryCountItem`. Eles existem no banco, criados fora das migrations
  versionadas. O histórico de migrations **não reconstrói o banco do zero**.
- enquanto isso durar, gere migration com o caminho sem shadow DB:
  ```bash
  npx prisma migrate diff \
    --from-schema-datamodel <schema-anterior> \
    --to-schema-datamodel prisma/schema.prisma --script
  ```
  Grave o `.sql` em `prisma/migrations/<timestamp>_<nome>/` e aplique com
  `npx prisma migrate deploy`.
- Se uma migration falhar, ela deixa linha `failed` em `_prisma_migrations` e
  **bloqueia todas as seguintes**. Resolva com
  `npx prisma migrate resolve --rolled-back <nome>` antes de tentar de novo.

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

## Design system
- `src/styles/tokens.css` é o único source of truth de cor. Nenhuma cor
  hardcoded fora dele.
- Regras de peso (`*`, headings) **precisam** estar dentro de `@layer base`.
  Fora de layer, elas vencem as utilitárias do Tailwind na cascata e zeram a
  tipografia da interface inteira. Há teste travando isso:
  `src/styles/tokens.test.ts`.
- Contraste WCAG AA é gate, não sugestão:
  `node scripts/auditar-contraste.mjs` (tem de sair 0 falhas).
  Mudou cor, rode o script.
- Pesos: 400 (corpo) e 600 (ênfase). 700 é reservado ao valor de KPI e à
  enfase numérica (roadmap 1.2 / 1.3).

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
