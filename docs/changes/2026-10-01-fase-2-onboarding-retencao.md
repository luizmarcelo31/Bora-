# Fase 2 — Onboarding, Retenção e Performance percebida

**Data:** 2026-10-01 · **Lote:** onboarding + changelog + CTA + lazy loading

## Contexto

A Fase 1 foi fechada em 29/09 com inspeção visual. Esta é a Fase 2 do
roadmap. O documento chegou com os 20 checkboxes da fase vazios, mas a
auditoria do código mostrou que 14 já estavam entregues — o roadmap é que
estava desatualizado, como já tinha acontecido com a Fase 1.

Faltavam de fato 6 itens. Este lote fecha os 6.

## O que entrou

### 1. Tela de boas-vindas com o nome do operador

`src/components/onboarding/OnboardingWelcome.tsx`

Primeiro nome do operador num dialog, uma vez por dispositivo. Fecha por
qualquer via (botão, Esc, clique fora) — mais honesto do que reexibir para
quem já leu.

Snapshot de servidor assume "não viu", e o cliente corrige na hidratação.
Abrir de forma assíncrona no mount fecharia o dialog antes de piscar na tela.

### 2. Checklist de 3 passos

`src/components/onboarding/OnboardingChecklist.tsx`

A divisão de estado é a decisão principal deste item:

| Passo | Onde mora | Por quê |
|---|---|---|
| Cadastrar produto | contagem no banco (`products > 0`) | é fato, não preferência |
| Fazer uma venda | vendas **concluídas históricas** | idem |
| Abrir relatório | localStorage | é descoberta, não operação |

Um operador que já vendia antes de abrir o app entra com o primeiro passo já
cumprido, em vez de receber três tarefas inúteis.

A contagem de venda é histórica de propósito: contar "hoje" reabriria a
tarefa todo amanheço para uma loja que opera há meses.

Some quando os três passos acabam — um checklist preso em "100%" todo dia
vira decoração.

### 3. Changelog in-app com badge

`src/lib/changelog.ts`, `src/lib/changelog-seen.ts`,
`src/hooks/use-changelog-seen.ts`, `src/app/dashboard/novidades/page.tsx`

Rota própria em vez de sheet: tem URL, dá para linkar e voltar depois.

Lista de versões é dado estático versionado, sem tabela. "Já vi" é estado de
dispositivo.

O badge usa `useSyncExternalStore` com evento próprio, **não** o evento
`storage` do navegador: aquele só dispara em outra aba, então marcar como
visto na página de novidades não atualizaria a sidebar na mesma aba. A
sidebar vive no layout e não remonta ao navegar, então um `useState` lido
uma vez ficaria preso num valor velho.

### 4. CTA nos estados vazios

`EmptyState` já aceito a prop `action` desde o começo, e **nenhum dos 22 usos
a passava**. Aplicada em 7 telas, com saída diferente por causa:

- filtro sem resultado → **Limpar filtros** (o texto dizia "nenhum resultado
  para o filtro" sem dar como desfazer)
- sem produto → **Cadastrar produto**
- sem venda → **Registrar venda**

"Estoque ok" e os logs de auditoria seguem sem CTA de propósito: não são
tela vazia, são ausência de problema — um botão ali seria ruído.

### 5. Lazy loading do `jspdf`

`src/components/shared/LazyReportActions.tsx`

`ReportActions` importa `jspdf` + `jspdf-autotable` (~400 kB) e estava no
bundle inicial de **cinco** páginas (Relatórios, Financeiro, Estoque,
Auditoria, recibo do PDV) só para que o operador clique em "Exportar PDF".

O wrapper é Client Component por exigência do guia local de lazy loading
(`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`): Server
Component importando Client Component **não** é code-split. `ssr: false`
porque o componente abre menu de impressão e usa `createPortal` no
`document.body`; o placeholder reserva a largura para o layout não pular.

### 6. Scroll restoration — sem código

Constatado **nativo**. App Router restaura scroll em navegação de histórico,
e o `#conteudo` do `AppShell` não cria container de scroll
(`overflow-auto`), então a restauração do window se aplica.

Um cache manual de scroll seria duplicar o framework. Ressalva registrada no
roadmap: vale para voltar, não para link-forward.

## Dois achados que mudaram o plano

**`DailySummary` não é multi-tenant.** `getTodaySummary()` conta
`prisma.sale.count({ where: { createdAt: { gte: today } } })` sem `tenantId`.
O roadmap pede "resumo diário no topo da Visão Geral" do tenant, e o
caminho óbvio era reaproveitar esse componente — que teria vazado venda de
outra loja para dentro do dashboard de cada loja.

Não reaproveitei. O `/dashboard` já tem `MetricCard` tenant-scoped com
"Faturado hoje" e o número de vendas, que cobrem o item. `DailySummary` segue
só no admin, onde a visão é de plataforma.

**Next é 16.3.5, não 14.2.** O `AGENTS.md` avisava sobre breaking changes e
estava certo: `next.config.ts` está vazio, sem Cache Components, o que
confirma que a restauração de scroll é só a de histórico.

## Bugs de tooling encontrados no caminho

**CRLF ao reescrever arquivo.** Uma troca mecânica de token via PowerShell
`Set-Content` reescreveu 5 arquivos de LF para CRLF. Achei conferindo
encoding antes de commitar — a mesma armadilha que a Fase 1 documentou. Os 5
foram normalizados de volta para LF e verificados: sem BOM, sem CRLF, sem
`U+FFFD`, acentos intactos.

Vale registrar porque `Set-Content` é o caminho óbvio e o padrão é comum.

## Verificação

- 168 testes / 22 suítes (era 150 / 20) — 18 novos em `changelog.test.ts` e
  `onboarding.test.ts`
- `npx tsc --noEmit` limpo
- `node scripts/auditar-contraste.mjs` → 0 falhas
- `node scripts/auditar-cores-hardcoded.mjs` → 0 ocorrências
- `node scripts/auditar-sentence-case.mjs` → 0 violações
- `node scripts/verificar-pesos.mjs` → 0 falhas

Sem migration: onboarding e changelog moram em localStorage por decisão
(estado de dispositivo), e nada aqui altera o schema.

## Pendência que fica

Os dois critérios de conclusão da Fase 2 — navegação abaixo de 200 ms
percebida e conclusão de onboarding acima de 80% — **não foram medidos**, e
não há como medi-los sem telemetry que o projeto não tem. Estão registrados
como pendentes no roadmap em vez de marcados como cumpridos com número
inventado.