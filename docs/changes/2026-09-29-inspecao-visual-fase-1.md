# 2026-09-29 — Inspeção visual da Fase 1 e correção de 1.3

> Fecha 1.3 e 1.4 com evidência medida no navegador. Espera confirmação
> visual na tela, não por busca de código.

## Método

`scripts/inspecao-fase1.mjs` sobe a aplicação com `next start`, faz login
como tenant e como super admin, percorre os 13 módulos do dashboard em light
e dark, mede os componentes de 1.3 e checa overflow em 375px. **Somente
leitura** — não cria, altera ou apaga dado. Credenciais vêm de variável de
ambiente e nunca são gravadas em disco.

Resultado final: **41/41 verificações, 0 erros de console.**

## O que a inspeção encontrou

O que já estava certo e foi confirmado com medição:

- 13/13 módulos respondem 200 com o `h1` esperado
- dark mode aplica `#0A0A0A` no body em **todos** os 13 módulos
- sidebar presente e visível, sem abrir atrás do conteúdo
- 375px: sem overflow horizontal em produtos, PDV e dashboard
- zero erros de console em toda a varredura

Quatro itens de 1.3 estavam realmente fora do especificado.

## Correções

### 1. Header de página sem fundo

Medido: `background-color: rgba(0, 0, 0, 0)` — transparente. O roadmap 1.3 pede
"fundo laranja no day, fundo `#111` no dark".

`PageHeader` era um `div` com apenas `border-b`. Virou uma faixa com token
próprio, para a mudança ser reversível numa linha:

```css
--page-header-bg: #BE592D;  /* day  */
--page-header-bg: #111111;  /* dark */
--page-header-fg: #FFFFFF;
```

Ambos os pares foram adicionados ao gate de contraste
(4.51:1 no day, 18.88:1 no dark). A faixa tem cantos arredondados e respiro —
é uma faixa, não uma tarja cheia. O badge do tenant deixou de usar
`variant="secondary"` (que ficava cinza sobre laranja) e passou a usar
fundo translúcido com a cor do texto corrente.

### 2. Tabela de produtos: preço e ícone

`text-align: start` na coluna de preço. O roadmap pede alinhado à direita.
Corrigido no `TableHead` e no `TableCell`, com `tabular-nums` preservado.

O ícone do produto sem foto usava `text-muted-foreground`. Roadmap pede
"ícone colorido" — passou a `text-primary`. O "dot de status" já existia via
`StatusBadge`.

### 3. Filter chips não eram pill

Medido: `border-radius: 10px` (`rounded-md`) e o trigger ativo com
`background: rgb(255, 255, 255)` — branco, não laranja. O roadmap 1.3 pede
"estilo pill, ativo em laranja/day e branco/dark".

`FilterTabs` passou a aplicar a forma pill e a cor de marca no ativo, usando
`data-[state=active]:`. **O estilo ficou no `FilterTabs`, não no `ui/tabs`**,
porque `Tabs` é genérico e mudar lá arrastaria todos os tabs da aplicação.
Como `FilterTabs` é compartilhado, os 13 módulos foram corrigidos de uma vez.

### 4. Alert tinha 2 variantes, não 4

O componente `Alert` só tinha `default` e `destructive`. O roadmap 1.3 pede
**4 variantes**. Adicionadas `success` e `warning`, usando os tokens de
status — assim acompanham o dark mode, ao contrário de uma cor fixa.

`src/components/ui/alert.test.tsx` trava o contrato: 4 variantes, todas com
ícone, título e corpo, e nenhuma com cor fixa de paleta. Esse teste é
necessário porque os alertas vivem dentro de dialogs fechados e não aparecem
numa varredura de DOM de página.

## Correção do próprio inspetor

Três das quatro "falhas" da primeira rodada eram erro de medição, não do
produto:

| Sintoma | Realidade |
|---|---|
| header transparente | o laranja estava no ancestral, o script media um nível acima |
| chips não-pill | `rounded-full` resolve para `3.35e+07px`; o regex `9999px` não casa. O pill e o laranja estavam corretos |
| 0 alertas | vivem em dialogs fechados; agora cobertos por teste unitário |

O `z-index` da sidebar mede `0` nos dois lados porque `z-index` só se aplica a
posicionado, e o layout usa grid. O critério original era inaplicável; o que
importa — a sidebar não abrir atrás do conteúdo — está confirmado pela
inspeção visual.

## Arquivos

- `src/components/shared/PageHeader.tsx` — faixa com token
- `src/components/shared/FilterTabs.tsx` — pill + ativo na cor de marca
- `src/components/ui/alert.tsx` — 4 variantes
- `src/components/ui/alert.test.tsx` (novo) — trava o contrato
- `src/app/dashboard/produtos/page.tsx` — preço à direita, ícone colorido
- `src/styles/tokens.css` — tokens da faixa
- `scripts/inspecao-fase1.mjs` (novo) — o inspetor
- `scripts/auditar-contraste.mjs` — par da faixa no gate

## Verificação

| Checagem | Resultado |
|---|---|
| `node scripts/inspecao-fase1.mjs` | 41/41, 0 erros de console |
| `node scripts/auditar-contraste.mjs` | 0 falhas / 46 pares |
| `node scripts/auditar-cores-hardcoded.mjs` | 0 ocorrências |
| `node scripts/auditar-sentence-case.mjs` | 0 violações |
| `npm test` | 150 testes / 20 suítes |
| `npx tsc --noEmit` | limpo |
| `npx next build --webpack` | compilou |

## Screenshots

`.qa/` (ignorado pelo git) tem light, dark, mobile e admin dos 13 módulos.
