# Fase 3.1 — Modo offline com fila de sincronização

**Data:** 02/10/2026
**Roadmap:** BoraMais 3.1 — único item pendente da Fase 3
**ADR:** `docs/decisions/ADR-006-modo-offline-pdv.md`
**Estado:** 6 de 6 passos implementados · 259 testes / 27 suítes · `tsc` limpo ·
build ok · 4 gates de design system verdes

## O que mudou

O PDV passou a vender sem internet. A venda é confirmada na hora, fica
gravada no aparelho e é enviada ao servidor quando a rede volta — sem que o
operador perca a venda nem o troco já entregue.

Escopo deliberado: **só a venda** (ADR-006 §1). Cadastrar produto, mexer em
caixa ou abrir relatório offline criaria estoque fantasma e saldo sem
conference — risco sem retorno no balcão.

## Arquivos

### Novo — núcleo puro (`src/lib/offline/`)

| Arquivo | Papel |
|---|---|
| `types.ts` | Dicionário do payload e vocabulário de erro. Sem React, sem DOM — importado pelo client e pelos testes |
| `reconcile.ts` | **A política de conflito.** Função pura: resposta do servidor + tentativa → desfecho. É onde mora a decisão difícil, e é testável sem browser, banco ou mock de rede |
| `queue.ts` | Fila FIFO e catálogo em `localStorage`. Única parte que fala com storage |
| `enviar.ts` | Tenta o servidor; enfileira **só** em erro de rede |
| `use-sync.ts` | Gatilhos de sincronização (online, visibilitychange, intervalo, botão) com backoff |
| `use-catalog-snapshot.ts` | Grava o catálogo quando o PDV carrega com rede |
| `divergencias.ts` | Lê as divergências da auditoria e resume |

### Novo — telas

- `src/app/dashboard/pdv/offline/` — PDV client-side que lê o catálogo do
  `localStorage`. É a rota que ADR-006 §2 escolheu **em vez** de service
  worker, porque cachear payload RSC do Next 16 é frágil e o cenário real é o
  operador com a aba aberta.
- `src/app/dashboard/divergencias/` — relatório para o gerente, no fechamento
  do mês.
- `src/components/offline/SyncIndicator.tsx` — contagem de pendentes no PDV.

### Alterado

- `prisma/schema.prisma` — `Sale.offline` e `Sale.occurredAt`
- `src/services/index.ts` — as 4 políticas do ADR, e o retorno agora carrega
  `divergencias`
- `src/app/dashboard/pdv/actions.ts` — repassa `offline`/`occurredAt` e grava a
  auditoria de divergência
- `pdv-client.tsx` e `use-express-sale.ts` — `enviarOuEnfileirar` no lugar do
  `createSaleAction` direto
- `caixa/close-dialog.tsx` — avisa sobre pendências ao fechar caixa
- `navigation/tenant-nav.ts` — item "Divergências offline"

## As 4 decisões de política

**1. Estoque: a venda vence.** Duas lojas vendem o mesmo estoque offline; a
segunda venda não pode ser recusada, porque o dinheiro foi entregue e a
mercadoria saiu. O estoque pode ficar negativo e a contagem de inventário
corrige. A divergência vai para a auditoria e para o relatório — sem registro,
isso vira estoque fantasma que ninguém explica no fechamento.

**2. Preço continua do servidor.** O snapshot local serve para listar e cobrar no
balcão, não para decidir o preço gravado. Aceitar preço do cliente permitiria
vender a R$ 0,01 com o app adulterado. Divergência de preço aparece como
problema de caixa, visível.

**3. Caixa fechado não recusa.** A venda entra sem `cashBoxId` e sem mexer em
saldo. Fechar caixa com pendência **avisa** mas não bloqueia — bloquear
transformaria recurso de emergência em rotina.

**4. `occurredAt` define cupom e DRE.** Sem ele, venda sincronizada 3 horas
depois receberia o cupom e o DRE do dia do sync, e o relatório do dia em que o
cliente pagou ficaria errado.

## Idempotência

`@@unique([tenantId, idempotencyKey])` já existia. A chave é gerada **no momento
da confirmação**, não no retry — é isso que torna reenvio um no-op. Se fosse
gerada no retry, cada tentativa criaria venda duplicada: exatamente o problema
que o modo offline existe para não causar.

## Migration

`prisma/migrations/20261002120000_sale_modo_offline/` — 2 colunas, gerada por
`migrate diff` (o caminho sem shadow DB, porque `migrate dev` segue quebrado).

**Achado de banco no caminho:** `migrate status` acusou
`20260929090000_add_plans_subscriptions` como aplicada no banco mas ausente do
histórico local, o que bloqueava todas as migrations seguintes. A linha estava
com `finished_at` nulo (`failed`) desde 29/09. As tabelas `Plan` e
`Subscription` **existem e estavam completas** — conferidas coluna a coluna
contra o schema antes de qualquer escrita. A pasta da migration foi criada com
o SQL fiel ao schema e marcada como `applied`; o histórico voltou a fechar.
Isso também fecha a lacuna de `AI_RULES` que registra 7 modelos sem migration.

## Testes

+91 testes (168 → 259), 27 suítes.

- `reconcile.test.ts` (18) — todos os desfechos: aceita, erro de rede com
  backoff, sessão expirada, divergência de estoque e caixa, erro final, erro
  desconhecido
- `queue.test.ts` (27) — isolamento por tenant **e** por operador, FIFO, dedupe,
  teto, storage bloqueado, JSON corrompido, integridade de entrada
- `enviar.test.ts` (16) — o que enfileira e o que não; `TypeError` e
  `AbortError` enfileiram, erro HTTP não
- `divergencias.test.ts` (11) — leitura da auditoria, `changes` corrompido
- `sale-offline.test.ts` (18) — as políticas no service, incluindo 3 testes que
  travam o comportamento online para não regredir

## Riscos aceitos

| Risco | Decisão |
|---|---|
| Cliente adulterado marcando `offline=true` para vender sem estoque | Aceito por desenho (§1); auditado e visível no relatório. Mitigação real exigiria assinatura de dispositivo — escopo de Fase 4 |
| Divergência cresce sem ninguém corrigir | Relatório + aviso no fechamento de caixa |
| Fila de 200+ vendas | Teto com recusa explícita ("NÃO foi salva") |
| Vazamento de fila entre operadores no aparelho compartilhado | Chave por `userId` + PIN de troca |
| Offline não sobrevive a fechar o app | Aceito: `localStorage` não éIndexedDB. Documentado no ADR |

## Verificação

```bash
npm test              # 259 testes / 27 suítes
npx tsc --noEmit      # limpo
npm run build         # ok, /dashboard/pdv/offline e /dashboard/divergencias nas rotas
node scripts/auditar-contraste.mjs        # 0 falhas
node scripts/auditar-cores-hardcoded.mjs  # 0 fora do token
node scripts/auditar-sentence-case.mjs    # 0 violações
node scripts/verificar-pesos.mjs          # 0 falhas
npx prisma migrate status                # up to date
```

**Gate pré-existente corrigido:** `scripts/verificar-pesos.mjs` lia
`.next/static/css`, caminho que o Next 16 não gera mais (o CSS sai em
`static/chunks/`). O gate quebrava com `ENOENT` antes de qualquer medição. Agora
procura nos dois e falha com mensagem clara se não houver build — gate que
quebra por layout de saída deixou de ser gate.

## Pendente — verificação manual (obrigatória)

O critério de pronto do ADR é comportamento com rede caída, e nenhum teste
unitário cobre isso. Precisa ser feito no navegador:

1. Modo avião no `/dashboard/pdv/express`, 3 vendas → indicador mostra 3
   pendentes, troco sai do total local
2. Abrir `/dashboard/pdv/offline` com o catálogo já cacheado → vende sem rede
3. 2º aparelho vende o mesmo estoque enquanto o 1º está offline
4. Reconectar → conferir no banco: **duas** vendas, estoque pode ficar
   negativo, duas linhas em `/dashboard/divergencias`
5. Fechar caixa com pendência → aviso aparece, fechamento acontece

Critério: **vender offline nunca perde venda e nunca duplica na fila.**

## Depois disto

Falta, para fechar a Fase 3, a conferência visual das três ressalvas já
registradas: alerta de estoque por e-mail não existe, o PDF não tem logo da
loja, e os perfis de acesso não foram conferidos um a um.
