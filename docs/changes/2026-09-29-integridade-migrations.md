# 2026-09-29 — Integridade de migrations: BOM, line-ending e lacuna de baseline

> Origem: enquanto executava o roadmap, uma migration falhou com
> `relation "Plan" already exists`. A causa não era o que parecia — e o
> conserto revelou dois problemas mais fundos no histórico de migrations.

## Sintoma

`npx prisma migrate dev` falhava com:

```
P3006 — Migration `20260918120000_sale_idempotency` failed to apply cleanly
        to the shadow database.
        ERROR: syntax error at or near "﻿"
```

O arquivo começava com BOM UTF-8 (`EF BB BF`) antes do primeiro `--`.

## Causa 1 — BOM (corrigido)

`prisma/migrations/20260918120000_sale_idempotency/migration.sql` tinha BOM.
O Postgres lê BOM como lixo e o replay no shadow database quebrava ali.

Removidos os 3 bytes. Como o Prisma guarda sha256 do arquivo em
`_prisma_migrations.checksum`, o banco precisou alinhar:

```sql
UPDATE _prisma_migrations SET checksum = '934979cbcd7b4f5ff8bffd357eb297158051f65c99faf94b637ad75ba724e536'
WHERE migration_name = '20260918120000_sale_idempotency';
```

Rollback do valor anterior (`538b8de79c889c1abbaeca70555a45dc9cc8f0643d6c2fce8dc4751c7caaeb18`),
caso o SQL aplicado precise ser preservado byte a byte. Executado por
`scripts/corrigir-migration-bom.cjs`, que imprime o rollback.

Mudança é só de bytes invisíveis. O SQL executado é idêntico.

## Causa 2 — `core.autocrlf` (corrigido)

Ao verificar os checksums, **5 das 8 migrations divergiam** do banco sem que
numa tivesse sido editada. Diagnóstico: `core.autocrlf: true` convertia
LF→CRLF no checkout do Windows, mudando os bytes e portanto o sha256.

Confirmado por `scripts/diagnosticar-divergencia.cjs`: as 5 batem exatamente
depois de normalizar CRLF→LF.

Correção: `.gitattributes` novo, com `prisma/migrations/** text eol=lf` e
LF para as demais extensões de texto. Os arquivos em disco foram normalizados.

**Consequência importante:** a divergência de checksum não era um problema
estético. Ela significa que qualquer um que fizesse `migrate deploy` num clone
Windows receberia "migration modified after applied" — deploy travado por
motivo que não tem nada a ver com edição de conteúdo.

## Causa 3 — baseline incompleto (**NÃO corrigido — bloqueia `migrate dev`**)

Depois de remover o BOM, o replay avançou e travou em outro lugar:

```
P1014 — The underlying table for model `Promotion` does not exist.
```

Auditoria: **7 dos 28 models não têm migration que crie a tabela**.

| Model | Tabela no banco? | Migration que cria? |
|---|---|---|
| `Promotion` | sim | **não** |
| `PromotionItem` | sim | **não** |
| `Supplier` | sim | **não** |
| `Purchase` | sim | **não** |
| `PurchaseItem` | sim | **não** |
| `InventoryCount` | sim | **não** |
| `InventoryCountItem` | sim | **não** |

As tabelas existem no Postgres e o schema Prisma as conhece, mas foram criadas
fora das migrations versionadas (provavelmente `db push` ou SQL manual).

**Efeito:** `npx prisma migrate dev` continua falhando. Ele reconstrói o banco
do zero num shadow database reaplando todas as migrations — e 7 tabelas nunca
são criadas ali. `migrate status` e `migrate deploy` funcionam normalmente;
só o `dev` está quebrado.

**Como fechar:** escrever migrations `CREATE TABLE` para as 7 tabelas e
baselinar, ou registrar explicitamente que o histórico não reconstrói o banco.
Enquanto isso, gerar migration pelo caminho sem shadow DB (`migrate diff` +
`migrate deploy`), documentado em `docs/AI_RULES.md`.

Não foi corrigido neste lote: exige decidir se o baseline deve refletir o banco
atual, e isso pede conferência do banco de verdade antes de escrever migration —
as tabelas podem ter sido criadas com formato diferente do que o schema assume.

## Entregue

- `.gitattributes` — LF obrigatório em migrations e fontes
- `20260918120000_sale_idempotency/migration.sql` — BOM removido
- `_prisma_migrations` — 1 UPDATE de checksum (rollback impresso)
- 6 arquivos de migration normalizados para LF
- `scripts/verificar-checksums.cjs` — detecta divergência e mostra a variante
  que bate (crucial para separar `autocrlf` de edição real)
- `scripts/diagnosticar-divergencia.cjs` — testa BOM e normalização de linha
- `scripts/corrigir-migration-bom.cjs` — correção com rollback
- `docs/AI_RULES.md` — seção "Banco, schema e migrations"

## Verificação

| Checagem | Resultado |
|---|---|
| `node scripts/verificar-checksums.cjs` | 8/8 migrations batem |
| `npx prisma migrate status` | up to date, 0 pendentes |
| `npx prisma migrate dev` | **ainda falha** — P1014, causa 3 |

## Estado do schema

Nenhuma tabela foi criada, alterada ou removida neste lote. A única escrita no
banco foi o UPDATE de checksum acima.
