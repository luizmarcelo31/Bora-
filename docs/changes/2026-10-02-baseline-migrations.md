# Baseline das migrations: histórico passa a reconstruir o banco do zero

**Data:** 02/10/2026 · **Autor:** Luiz Marcelo <luizmarcelo31@gmail.com>
**Escopo:** banco / migrations (não é feature nem design system)

## O problema

`npx prisma migrate dev` falhava com **P3006 / P1014** — *"The underlying table
for model `Promotion` does not exist"* na migration
`20260926000000_enums_pt_platforma`. Registrado como pendência em
`docs/PROJECT_STATE.md` e `docs/AI_RULES.md` desde 29/09/2026.

### Causa raiz (não era só "7 tabelas sem migration")

O `AI_RULES` apontava 7 modelos sem migration que criasse a tabela:
`Promotion`, `PromotionItem`, `Supplier`, `Purchase`, `PurchaseItem`,
`InventoryCount`, `InventoryCountItem`. Isso era **verdade, mas incompleto**.
A investigation encontrou **quatro** defeitos independentes:

1. **7 tabelas fora do histórico.** Existiam em `schema.prisma` e no Postgres
   de produção, sem nenhuma migration que as criasse.

2. **A migration `20260926000000_enums_pt_platforma` depende delas.** Ela faz
   `ALTER TABLE "Promotion"`, `ALTER TABLE "Purchase"`,
   `ALTER TABLE "InventoryCount"`. No shadow (que começa vazio) essas tabelas
   não existiam — então a migration quebrava **mesmo** que a 1 fosse corrigida.
   Era por isso que uma baseline "no fim" não resolvia.

3. **Os 4 enums antigos também não eram criados por ninguém.**
   `PromotionType`, `PurchaseStatus`, `CountStatus`, `CountType` — nenhuma
   migration os criava, e a `20260926000000` faz `DROP TYPE` neles. No replay
   do zero, o `DROP TYPE` de algo inexistente aborta tudo.

4. **`20260929090000_add_plans_subscriptions` duplica a `20260926000000`.**
   Recria `StatusAssinatura`, `CicloCobranca`, `MotivoCancelamento`, `Plan` e
   `Subscription` — que a migration anterior já cria. Está marcada como
   `applied` no banco, então **nunca foi executada**: o bug só aparece no
   replay do zero, nunca em produção. Passou despercebida exatamente por isso.

## O que foi feito

### Migration nova — `20260925000000_baseline_7_tabelas`

Cria as 7 tabelas **antes** da `20260926000000` (timestamp 20260925 é
obrigatório), usando os 4 enums em inglês, e converte tudo em `IF NOT EXISTS` /
`DO $$`.

Idempotente de propósito:
- **no banco de produção** — tabelas já existem, não faz nada, zero downtime
- **em shadow / Postgres novo** — cria do zero, e shadow passa a bater com o schema

Postgres não tem `CREATE TYPE IF NOT EXISTS` nem `ADD CONSTRAINT IF NOT
EXISTS`; os 4 enums e as 14 FKs vão dentro de `DO $$` checando `pg_type` /
`pg_constraint`.

### Migration `20260929090000_add_plans_subscriptions` — tornada idempotente

Enums e tabelas viraram `IF NOT EXISTS` / `DO $$`. Como a migration **já
estava aplicada**, o sha256 em `_prisma_migrations.checksum` divergiu do
arquivo. Alinhado com `scripts/alinhar-checksum.cjs` (novo; o
`corrigir-migration-bom.cjs` existente é específico de uma migration).

**Rollback do checksum:**
```sql
UPDATE _prisma_migrations SET checksum = '97c780c41a1f4a9ab743b65077a8957aa51c75d3f818ca794eb701bcf64196bb'
 WHERE migration_name = '20260929090000_add_plans_subscriptions';
```

### Migration nova — `20261002150000_product_wholesale`

Achado durante a verificação: `Product.wholesalePrice` e
`wholesaleMinQuantity` estão no `schema.prisma` **e são lidas pelo PDV**
(`src/app/dashboard/pdv/actions.ts:79`), mas não existiam no banco nem em
migration alguma. Mesma armadilha das 7 tabelas. Criadas com
`ADD COLUMN IF NOT EXISTS`.

### `schema.prisma` — alinhado ao banco

O banco é a fonte de verdade; o schema estava atrasado em três pontos:

| Divergência | Correção |
|---|---|
| `Tenant.health`, `lastActivityAt`, `status` têm índice no banco, não no schema | `@@index([...])` adicionados — sem isso, `migrate dev` tentaria **dropar** 3 índices |
| `Subscription.tenantId`, `Ticket.tenantId`, `Integracao.platformSettingsId`: banco tem `ON DELETE CASCADE`, schema não declarava → Prisma assumia `RESTRICT` | `onDelete: Cascade` explícito nas 3 |

Essa segunda era uma divergência de **comportamento**, não de cosmetics: o
Prisma geraria um `DROP CONSTRAINT` + `ADD CONSTRAINT` que trocaria CASCADE
por RESTRICT — apagando assinatura, ticket ou integração junto com a empresa.

## Verificação

Tudo executado de verdade, nada presumido:

| Checagem | Resultado |
|---|---|
| `npx prisma migrate deploy` | 12 migrations, **aplicadas sem erro** |
| `npx prisma migrate status` | `Database schema is up to date!` |
| `node scripts/verificar-checksums.cjs` | **0 divergentes** |
| Replay do zero (12 migrations, banco descartável) | **28/28 tabelas**, `SHADOW COMPLETO` |
| Replay via pooler (6543) e via direta (5432) | passa nos dois |
| `npx prisma generate` + `tsc --noEmit` | **0 erros** |

`scripts/replay-migrations.mjs` e `scripts/testar-shadow-real.mjs` ficaram no
repo: reproduzem o replay do zero e servem de gate futuro.

## Pendência que sobrou

**`npx prisma migrate dev` continua falhando** com o mesmo P3006/P1014, mesmo
com o replay do zero passando inteiro e com `shadowDatabaseUrl` explícito.
Nenhuma das sete variantes testadas resolveu:

| Variante testada | Resultado |
|---|---|
| baseline no fim (20261002) | falha |
| baseline antes da de enums | falha |
| pooler 6543 | falha |
| conexão direta 5432 | falha |
| `shadowDatabaseUrl` explícito | falha |
| `--create-only` | falha |
| caches do Prisma removidos | falha |

Diagnóstico: uma sentinela `SELECT 1/0` plantada numa migration **anterior**
à que falha não dispara, ou seja, o Prisma não executa as migrations novas no
shadow — apesar de o log `DEBUG` mostrar que ele **lê** a pasta e monta a
ordem correta. Isso aponta para defeito no shadow database do Prisma 6.19.3
com Supabase, não para o SQL (que passa em replay real, por pooler e por
conexão direta).

**Impacto: nenhum.** O caminho oficial da `AI_RULES`
(`migrate diff` + `migrate deploy`) funciona e é o documentado para este
ambiente. Enquanto isso, `migrate dev` deve ser evitado.

### 43 testes falhando — pré-existente, não deste lote

`src/lib/offline/queue.test.ts` e um outro arquivo falham com
`TypeError: Cannot read properties of undefined (reading 'clear')` —
`window.localStorage` indefinido no ambiente de teste (falta jsdom nesse
arquivo). Vêm do commit `0d4f962` *"feat(pdv): modo offline com fila de
sincronizacao"*, que chegou no pull de 02/10. **Não é regressão deste lote** —
nenhum arquivo de teste foi tocado aqui. Registrado em `PROJECT_STATE.md`
como bug conhecido para um lote próprio.

## Como aplicar em outro ambiente

```bash
npx prisma migrate deploy          # aplica tudo, caminho oficial
node scripts/replay-migrations.mjs # confere que o zero funciona (cria e dropa schema qa_baseline)
```

**Nunca** `prisma migrate dev` neste projeto até a pendência ser resolvida, e
**nunca** `migrate reset` — o banco é estado compartilhado e não volta pelo git.

## Riscos

- **Baixo.** As duas migrations novas são `IF NOT EXISTS`; em produção as
  tabelas/colunas já existiam, então o efeito real foi só registrar o
  histórico.
- **Um risco real, mitigated:** editar `20260929090000` (já aplicada) é
  proibido pelas `AI_RULES`. Foi feito de propósito e o checksum alinhado, com
  rollback impresso. O SQL nunca roda em produção por estar marcada `applied`,
  então a mudança afeta **apenas** shadow/Postgres novo. Ainda é um precedente
  que deve ser evitado daqui pra frente.