# ADR-006 — Modo offline no PDV com fila de sincronização

**Data:** 2026-10-01
**Status:** Aceito (proposta detalhada, implementação não iniciada)
**Fase:** Roadmap BoraMais 3.1 — único item pendente da Fase 3

## Contexto

O PDV hoje é 100% servidor: `createSaleAction` repreçoa o carrinho no banco
(`src/app/dashboard/pdv/actions.ts:77-93`), valida estoque dentro da transação
(`src/services/index.ts:547-557`), e só então grava venda, movimentação,
estoque, caixa e financeiro. Sem rede, a venda não existe: o operador vê
"Não foi possível concluir a venda" depois de já ter handed o troco.

Conveniência tem internet instável por natureza — paywall do estabelecimento, 4G
que cai dentro do caixa, vistoria de loja com o app aberto. Perder venda é
perder dinheiro e confiança; o roadmap trata isso como item de **Fase 3**, e é o
único que falta lá.

### O que já existe e muda o desenho

| Fato | Onde | Consequência para o offline |
|---|---|---|
| `@@unique([tenantId, idempotencyKey])` | `prisma/schema.prisma:242` | Replay da fila é seguro por construção. Não precisa de dedupe no cliente. |
| Preço sempre relido do banco | `pdv/actions.ts:77-93` | Cliente offline não pode precificar sozinho sem quebrar a regra "nunca confiar no frontend". |
| Estoque revalidado dentro da tx | `services/index.ts:547-557` | Venda offline reenfileirada pode falhar por estoque insuficiente. Precisa de política. |
| Caixa condicional a `status: 'ABERTO'` | `services/index.ts:582-593` | Venda offline que referencia caixa fechado no sync estoura `CLOSED_CASHBOX`. Precisa de política. |
| `couponSeq` = contagem do dia + retry em corrida | `services/index.ts:479-480, 628-636` | Número de cupom é sequencial por tenant+dia, não cronológico. Offline passa a ser ilegível. |
| `financialMovement.movementDate = s.createdAt` | `services/index.ts:597-607` | Se `createdAt` for o horário do sync, DRE do dia da venda fica errado. |
| Sem service worker | `src/app/manifest.ts` só gera manifest | Não há app shell offline. Precisa de rota client-side ou SW. |
| `localStorage` como padrão de estado de dispositivo | `src/lib/changelog-seen.ts`, `src/lib/onboarding-seen.ts` | A fila deve seguir o mesmo padrão do repo, não introduzir IndexedDB sem necessidade. |

## Decisão

### 1. Escopo: fila de vendas, não sistema offline

O offline cobre **a venda do PDV e nada mais**. Estoque, cadastro de produto,
caixa, financeiro, relatórios e configurações continuam exigindo rede. Justificativa
de escopo: venda é a única operação que não pode esperar, e é a única que o
operador já fez fisicamente (dinheiro recebido, mercadoria entregue). Cadastrar
produto offline cria estoque fantasma sem forma de auditar; caixa offline cria
saldo sem conferência. Ambos são risco sem retorno no PDV.

### 2. Rota dedicada `/dashboard/pdv/offline`, não service worker

A tela offline é uma rota client-side que lê o catálogo do `localStorage` e
escreve na fila. Não é a página `/dashboard/pdv/express` servida por Server
Component.

Alternativa considerada: service worker precacheando o app shell e as payloads
RSC do App Router. Descartada — cachear RSC do Next 16 é frágil (a chave do
cache depende de headers e versão de build, e uma entrada stale devolve uma
tela com estado de servidor velho), e o payoff é pequeno: o cenário real é o
operador com a aba aberta e a rede caindo, não o operador reabrindo o app em
parvo. SW/installável continua na Fase 4.4.

### 3. Armazenamento: `localStorage`, com fila pura e testável

`src/lib/offline/` com três módulos puros, sem React:

- `catalog.ts` — snapshot do catálogo (`id`, `name`, `price`, `stock`,
  `barcode`, `category`, `imageUrl`), chave `boramais:pdv:catalog:<tenantId>`,
  escrito sempre que `/dashboard/pdv` ou `/pdv/express` carregam com rede.
- `queue.ts` — fila FIFO de vendas pendentes, chave `boramais:pdv:fila:<tenantId>:<userId>`,
  teto de 200 entradas (~60 kB). Cada entrada carrega o `idempotencyKey` gerado
  **no momento em que a venda é confirmada**, não no retry.
- `reconcile.ts` — função pura: dada a resposta do servidor e a entrada da fila,
  decide `remover` | `marcar_divergencia` | `reenfileirar`. É onde mora a
  política de conflito, e é 100% testável sem browser.

`userId` no chave da fila é obrigatório: o PDV é compartilhado entre operadores
(PIN de troca, `pdv-client.tsx:178`). A fila de um operador não pode ser
sincronizada no login de outro.

Se a fila crescer além do teto, ou se a carga de uma venda passar de ~1 kB
(foto de produto embutida), o instrumento de troca é IndexedDB — e só o
`queue.ts` muda, porque a fila é a única coisa que fala com storage.

### 4. Detecção de rede: `navigator.onLine` é dica, não fato

`navigator.onLine` só diz se há interface de rede, não se há rota até a
API. A regra é: **sempre tenta**, e enfileira só em erro de rede (`fetch`
rejeitado, timeout, `navigator.onLine === false` confirmado). Erro HTTP
— inclusive 401 — não enfileira: significa que a requisição chegou e foi
recusada, e repetir não muda a resposta.

### 5. Conflito de estoque: a venda vence o estoque

Duas lojas, ou a mesma loja em dois aparelhos, vendem o mesmo estoque offline.
No sync, a segunda venda bate em `INSUFFICIENT_STOCK`. As três saídas:

| Política | Consequência | Veredito |
|---|---|---|
| Rejeitar a venda | Dinheiro foi entregue e a mercadoria saiu da prateleira. Perda direta. | Descartada |
| Aceitar e clamping no disponível | Venda fica menor que o que o cliente pagou. Mentira no caixa. | Descartada |
| **Aceitar a venda, estoque pode ficar negativo, divergência registrada** | O físico aconteceu. A contagem de inventário corrige o número depois. | **Escolhida** |

O caminho é `allowNegativeStock` por tenant, mas independente dele: uma venda
que **ocorreu** não pode ser perdida. `services/index.ts:547-557` ganha uma
borda — quando a venda veio da fila (`offline = true`), a validação de estoque
não lança `INSUFFICIENT_STOCK`; registra divergência e segue. A venda continua
`CONCLUIDA`, porque para o caixa ela foi concluída.

Toda venda com divergência de estoque gera entrada em `logAudit` e uma linha no
relatório de divergências, para o gerente resolver no inventário.

### 6. Preço: o servidor continua donando o preço

Venda offline confirmada com preço em cache e preço no banco divergente (o
preço mudou enquanto o aparelho estava sem rede). O servidor usa o preço do
banco, como sempre, e a venda fica marcada `priceSnapshot = false`. O troco já
foi dado com o preço antigo: a diferença é um problema de caixa, não um motivo
para inventar preço no servidor. Registrar a divergência e não o preço do
cliente é o que mantém a lei de `AI_RULES` ("nunca confiar no frontend")
intacta. O custo disso aparece como troco a recompor, e é visível.

### 7. Caixa fechado: venda entra sem tocar no saldo

Venda enfileirada referencia `cashBoxId` que pode ter fechado antes do sync.
`CLOSED_CASHBOX` é a resposta honesta para operação online, e a errada para
operação offline — o dinheiro está na gaveta. Política: a venda é gravada com
`cashBoxId = null` e `divergenciaCaixa = true`, sem incrementar
`currentBalance` de caixa nenhum. A conciliação de caixa mostra o valor na
fila de conciliação manual. Fechar caixa com fila pendente deve **avisar**
(`PDV: 3 vendas aguardando sync`), não bloquear.

### 8. Duas colunas novas em `Sale`

```prisma
offline        Boolean   @default(false)  // veio da fila do dispositivo
occurredAt     DateTime?                  // quando a venda aconteceu de fato
```

`occurredAt` é a peça que resolve cupom e DRE ao mesmo tempo, sem coluna
extra: com ela, `couponDate` e `financialMovement.movementDate` passam a usar
`occurredAt ?? createdAt`. Sem ela, toda venda offline cai no dia do sync e o
DRE do dia real fica errado.

O cupom diário continua sequencial (`count(tenantId, couponDate) + 1` com retry
de `P2002`) — não há exigência de ordem cronológica, e a sequência não pode
colidir. Uma venda de ontem sincronizada hoje recebe o cupom de hoje, e o
relatório de cupons mostra a data real em `occurredAt`. É uma leitura
inconsistente em relatório de cupom, aceita e documentada.

Migration pelo caminho sem shadow DB (AI_RULES §Banco):

```bash
npx prisma migrate diff \
  --from-schema-datamodel <schema-anterior> \
  --to-schema-datamodel prisma/schema.prisma --script
npx prisma migrate deploy
```

### 9. Gatilho de sync

Sequencial, FIFO, com backoff exponencial (1s, 2s, 4s, 8s, teto 30s) e teto de
tentativas por entrada:

- evento `online` da window
- `visibilitychange` → `document.visibilityState === 'visible'`
- botão manual "Sincronizar agora", com contagem de pendentes visível
- intervalo de 60s enquanto houver pendente

Sequencial porque cada venda decrementa estoque e consome cupom; paralelo
transforma a reconciliação em corrida por-sequência sem ganho — a fila é de
vendas de um operador, não milhares por segundo.

### 10. Sessão expirada durante o offline

Supabase JWT expira (~1h). Vendas enfileiradas podem ficar horas pendentes e o
sync volta 401. Política: pausar a fila, mostrar "entre novamente para
sincronizar", **preservar a fila**. Ao reconectar com sessão válida, retomar
automaticamente. Nunca descartar venda enfileirada por erro de sessão.

## Alternativas descartadas

- **IndexedDB desde já.** O repo usa `localStorage` para estado de dispositivo
  (`changelog-seen.ts`, `onboarding-seen.ts`), a carga é pequena (300 B por
  venda) e `localStorage` é síncrono, o que torna a fila trivialmente
  consistente. IndexedDB entra como troca de `queue.ts` se a carga mudar.
- **Service worker com app shell offline.** Ver §2.
- **Confiar no preço do cliente offline.** Violaria `AI_RULES` e permitiria
  vender a R$ 0,01 com o app adulterado. Ver §6.
- **Rejeitar venda offline por estoque.** Perda direta de dinheiro. Ver §5.
- **Fila no servidor** (tabela `pending_sales` criada pelo app). Não é offline:
  exige rede para enfileirar. Inútil para o problema.
- **Espelhar todo o banco no dispositivo.** Fora de escopo (§1).

## Riscos

| Risco | Mitigação |
|---|---|
| Fila de dispositivo sequestrada em aparelho compartilhado | Chave por `userId`; sync exige sessão do mesmo operador; PIN de troca em uso |
| Divergência de estoque cresce sem ninguém corrigir | Relatório de divergências + alerta no dashboard |
| Payload da fila corrompido / storage bloqueado (modo privado) | `reconcile.ts` trata entrada inválida como removível e registra; venda confirmada sem fila é evento visível no audit |
| Cliente adulterado forçando `offline = true` para vender com estoque insuficiente | Aceito por desenho (§5); auditado e visível. Mitigação real exigiria assinatura de dispositivo — escopo de Fase 4 |
| `allowNegativeStock` ligada esconde a divergência | Relatório lista venda offline mesmo com estoque ok |

## Sequência de implementação

Cada passo é um PR e sai verde sozinho.

1. **`src/lib/offline/` puro** — `catalog.ts`, `queue.ts`, `reconcile.ts` +
   testes vitest de `reconcile` (todos os desfechos: sucesso, replay,
   `INSUFFICIENT_STOCK`, `CLOSED_CASHBOX`, 401, entrada corrompida). Zero
   integração. Prova a política de conflito sem tocar em tela.
2. **Schema + service** — `offline`/`occurredAt` em `Sale`, borda de estoque em
   `services/index.ts`, `couponDate`/`movementDate` por `occurredAt`,
   divergência de caixa. Testes de service.
3. **Screenshot de catálogo** — escrita do snapshot quando `/pdv` e `/pdv/express`
   carregam. Teste de que o snapshot não vaza entre tenants (chave por tenant).
4. **Interceptação no PDV** — `confirmSale` tenta a action; erro de rede enfileira
   e a UI confirma ("venda #local salva, sincroniza quando voltar"); erro HTTP
   mostra a mensagem de sempre. Toast de troco usa o total local.
5. **Sync + rota `/dashboard/pdv/offline`** — `SyncIndicator`, gatilhos de §9,
   contagem de pendentes, aviso no fechamento de caixa.
6. **Relatório de divergências** — vendas offline com estoque/caixa divergente,
   atalho para o inventário.

## Verificação

```bash
npm test                              # + suítes de reconcile e queue
npx tsc --noEmit
node scripts/verificar-checksums.cjs  # migration nova em LF
npx prisma migrate status
```

Manual obrigatório: modo avião no `/pdv/express`, 3 vendas, remover do ar,
2º aparelho vende o mesmo estoque, reconectar, conferir no banco que existem
**duas** vendas com estoque negativo e duas linhas no relatório de divergências.
Critério de pronto: vender offline nunca perde venda e nunca duplica na fila.
