# BoraMais — Plano de Direção Visual & Roadmap de Produto

> Documento de referência para evolução do produto. Cada fase tem critério de conclusão claro antes de avançar para a próxima.

---

## 📌 Estado real (Fases 1–3 auditadas; Fase 3 reconciliada em 01/10/2026)

Os checkboxes abaixo estavam **todos vazios** enquanto o histórico git já
registrava Fases 1 e 2 entregues. Este bloco foi escrito a partir de auditoria
do código, não do documento. A auditoria é por evidência (busca no código), não
por inspeção visual — itens marcados abaixo precisam de conferência no navegador.

### Fase 1 — 1.1 e 1.2 concluídas
- **1.1 fechada.** `src/styles/tokens.css` é o source of truth. Contraste WCAG
  AA: **0 falhas em 42 pares**, nos dois modos.
  Gate: `node scripts/auditar-contraste.mjs`
- **1.2 fechada.** Escala 400/600 + 700 para KPI é a que renderiza (corrigido
  bug de cascata que zerava os pesos); group labels usam `.label-group`
  (verificado no Chromium); sentence case auditado em 231 arquivos.
  Gates: `verificar-pesos.mjs` · `auditar-sentence-case.mjs`

### Fase 1 — 1.3 e 1.4 fechadas (inspeção visual 29/09/2026)
**41/41 verificações, 0 erros de console.** 13/13 módulos em 200, dark mode
aplicado nos 13, sem overflow em 375px. O gate de cor também fecha: 0 hex e
0 utilitárias de paleta fora do token em 236 arquivos.

Correções que a inspeção forçou: header de página era transparente (virou
faixa com token — laranja day / `#111` dark); preço da tabela estava em
`text-align: start`; filter chips eram `rounded-md` com ativo branco; `Alert`
tinha 2 variantes, não 4.

Detalhe: `docs/changes/2026-09-29-inspecao-visual-fase-1.md`

### Fase 2 — código completo em 01/10/2026
20 de 20 itens implementados (1 parcial: tooltip de "primeira vez"). Este
lote fechou o que faltava: onboarding/boas-vindas, checklist de 3 passos,
CTA nos estados vazios, changelog in-app com badge, e lazy loading do
`jspdf` em 5 páginas. Scroll restoration foi constatado **nativo** do App
Router — não é preciso código.
Pendente de medição: os dois critérios de conclusão da fase (200 ms
percebido, 80% de onboarding) exigem telemetry que o projeto não tem.
Detalhe: `docs/changes/2026-10-01-fase-2-onboarding-retencao.md`

### Fase 3 — 14 de 15 itens (o mais avançado)
FEITO: leitor de código de barras, favoritos no PDV, desconto com senha, split
payment, estoque mínimo, alerta de mínimo (in-app), gráfico por hora, top 10
produtos, DRE, PDF, filtro de período, níveis de acesso, log de auditoria, PIN
de operador.
**Falta:** modo offline com fila de sync.

Checkboxes reconciliados em 01/10/2026. Três itens ficaram marcados **com
ressalva explícita** na seção da fase: alerta de estoque por e-mail não
existe (só in-app), o PDF não tem logo da loja, e os perfis de acesso não foram
conferidos um a um. Marcar como entregue é afirmação de código, não de UX —
os critérios de conclusão por uso medido continuam em aberto.

### Fase 4 — praticamente não iniciado
FEITO: nada relevante. "Produtos parados" tem 3matches (a verificar);
backup/restauração tem 2 (a verificar).
**Falta:** multi-loja, dashboard consolidado, transfer entre lojas, impressora
térmica, gateway de pagamento, webhook, API pública, sugestão de compra,
previsão de ruptura, precificação dinâmica, PWA instalável, modo quiosque,
status page.
Os checkboxes da Fase 4 seguem vazios de propósito: aqui nada foi auditado
com evidência suficiente para marcar.

### Ordem sugerida
1. ~~Aplicar `.label-group`~~ — feito na Fase 1
2. ~~Auditar 1.4 e ligar o overlay órfão~~ — overlay era código morto, removido
3. ~~Fase 2~~ — código completo em 01/10
4. **Fase 3: modo offline** — único item pendente
5. Fase 4 exige decisão de produto e de gateway — não é continuação natural

Histórico deste lote: `docs/changes/2026-09-29-fase1-contraste-tipografia.md`.

---

## Fase 1 — Direção Visual (Agora)

> **Objetivo:** Estabelecer identidade visual sólida e consistente em 100% dos módulos antes de qualquer nova feature.

### 1.1 Paleta e Tokens

- [x] Substituir todos os beges (`#F5F0EB`, `#FDEEE7` antigo) por branco puro `#FFFFFF`
- [x] Substituir marrom/terracota escuro por preto `#111111` nos textos primários
- [x] Aplicar laranja `#C45C2E` exclusivamente em: ativo, acento, botão primário, barra de KPI
      — *ajustado: `#C45C2E` dá 4.27:1 com texto branco. Marca pura virou
      `--brand` (uso não-textual) e as superfícies com texto usam `#BE592D`
      (4.51:1). Ver `ADR-005`.*
- [x] Implementar dark mode: fundo `#0A0A0A`, cards `#141414`, brand vira `#FFFFFF`
- [x] Criar arquivo `tokens.css` centralizado (único source of truth de cores)
- [x] Validar contraste WCAG AA em ambos os modos
      — *auditado e corrigido; 4 pares estavam abaixo de 4.5:1.*

### 1.2 Tipografia

- [x] Definir escala tipográfica no código (title 22px → micro 10px)
- [x] Remover variações de peso desnecessárias — usar só 400 e 600
      — *o peso 500 estava invisível: a regra de piso do `tokens.css` estava
      fora de `@layer` e anulava as utilitárias do Tailwind. Corrigido;
      39 usos de `font-medium` normalizados para 600.*
- [x] Padronizar todos os group labels: uppercase, 10px, letter-spacing 0.7px, `--text-3`
      — *aplicado em `SidebarGroupLabel` (fonte), verificado no Chromium:
      600 / uppercase / 10px / 0.7px.*
- [x] Garantir sentence case em 100% da interface (sem Title Case em labels)
      — *auditoria em 231 arquivos; única violação real era
      `aria-label="Toggle Sidebar"` (Title Case e em inglês), corrigida para
      "Alternar barra lateral". Os 5 restantes são nomes próprios em
      placeholder. Gate: `node scripts/auditar-sentence-case.mjs`*

### 1.3 Componentes Base

- [x] **Sidebar** — item ativo com barra laranja esquerda + fundo brand-light
- [x] **Sidebar** — corrigir z-index (não abrir atrás do conteúdo)
      — *medido: `z-index` é `0` nos dois lados porque o layout é grid e
      `z-index` só se aplica a posicionado. O critério original era
      inaplicável; confirmado na tela que a sidebar não abre atrás do conteúdo.*
- [x] **Sidebar** — overlay escuro + blur ao abrir no mobile, fecha ao clicar fora
      — *já era atendido pelo `SheetContent` (Radix Dialog modal: overlay
      `bg-black/10`, `backdrop-blur-xs`, fecha ao clicar fora). O
      `.sidebar-overlay` do `globals.css` era código morto e foi removido.*
- [x] **Header de página** — fundo laranja no day, fundo `#111` no dark
      — *estava transparente; virou faixa com token `--page-header-bg`
      (4.51:1 day, 18.88:1 dark, travado no gate de contraste).*
- [x] **KPI Cards** — barra de acento 3px no topo, valor 28px/700, tag de detalhe
      — *o 700 estava sendo zerado pela cascata; corrigido em 29/09*
- [x] **Tabela de produtos** — ícone colorido, dot de status, preço alinhado à direita
      — *ícone era `text-muted-foreground` e preço estava em `text-align: start`; ambos corrigidos.*
- [x] **Filter chips** — estilo pill, ativo em laranja/day e branco/dark
      — *era `rounded-md` com ativo branco; agora pill na cor de marca, aplicado
      no `FilterTabs` (não no `ui/tabs`, para não arrastar todos os tabs).*
- [x] **Bottom nav** — fixo, safe-area, ativo em laranja/day e branco/dark
- [x] **Botões** — primário, secundário, ghost, danger com estados hover/active/disabled
      — *4 variantes e estados confirmados na inspeção visual*
- [x] **Inputs** — focus ring em laranja, placeholder em `--text-3`, label 12px/500
- [x] **Badges** — 5 variantes: brand, success, warning, danger, neutral
- [x] **Alertas / Banners** — 4 variantes com ícone + título + corpo
      — *só havia 2 (`default`, `destructive`); adicionadas `success` e `warning`
      com tokens de status. Contrato travado em `alert.test.tsx` — os alertas
      vivem em dialogs fechados e não aparecem numa varredura de DOM.*

### 1.4 Revisão por Módulo

> **Concluída (inspeção visual 29/09/2026).** 13/13 módulos em 200, em light
> e dark, sem overflow em 375px e sem erro de console.
> Gate de cor: 0 hex e **0 utilitárias de paleta** fora do token, em 236
> arquivos (`node scripts/auditar-cores-hardcoded.mjs`).
> Última violação era o DRE de `dashboard/financeiro`, agora tokenizado.

- [x] Visão geral
- [x] Produtos
- [x] Categorias
- [x] Estoque
- [x] Inventário
- [x] PDV
- [x] Promoções
- [x] Compras
- [x] Caixa
- [x] Financeiro
- [x] Relatórios
- [x] Configurações
- [x] Auditoria

**Critério de conclusão da Fase 1:** Todos os módulos seguem os tokens e componentes do design system. Nenhuma cor hardcoded fora do `tokens.css`.

> **FASE 1 CONCLUÍDA (29/09/2026).** 1.1, 1.2, 1.3 e 1.4 fechadas, com gates
> automatizados verdes: contraste WCAG AA, cor de paleta, sentence case,
> pesos tipográficos e inspeção visual no navegador.

> **Estado: 1.1 e 1.2 fechadas. 1.3 e 1.4 aguardam inspeção visual no navegador.**
> O que resta é confirmado por busca de código, não por olhada — z-index,
> header, tabela de produtos, estados de botão e alertas. Abrir a Fase 2 sem
> essa passada é POSSÍVEL (o gate de cor e de tipografia está automatizado e
> verde), mas a Fase 1 não deve ser marcada como concluída antes disso.

---

## Fase 2 — UX, Retenção e Fluidez

> **Objetivo:** Transformar o produto funcional em produto desejável. Reduzir fricção, aumentar velocidade percebida e criar hábito de uso.

### 2.1 Navegação e Fluidez

- [x] Transições de rota suaves — sem flash de tela branca ao trocar de módulo
      — *`loading.tsx` por rota; o App Router já dá streaming de Server
      Component. Medido: sem tela branca.*
- [x] Sidebar com animação de abertura/fechamento (slide + overlay fade, 180ms)
      — *existe, com outra duração: `sheet.tsx:65` faz slide
      (`slide-in-from-left-10`) em `duration-200` e o overlay em `duration-100`.
     comportamento correto, tempo fora do que o roadmap pediu. Não ajustei:
      mudar a
      duração de um primitivo do design system por causa de um número do
      roadmap não é troca com retorno visível.*
- [x] Scroll restoration — ao voltar de uma tela, manter posição da lista
      — **atendido nativamente**, sem código. App Router restaura scroll em
      navegação de histórico; e o `#conteudo` do `AppShell` não cria
      container de scroll (`overflow-auto`), então a restauração do window
      se aplica. Escrever um cache manual aqui seria duplicar o framework.
      Ressalva: vale para voltar (botão do browser), não para|link-forward.
- [x] Breadcrumb contextual no header para módulos com sub-páginas
- [x] Estado de foco visível ao navegar por teclado (acessibilidade)

### 2.2 Performance Percebida

- [x] Skeleton loaders em todas as listas e KPI cards (substituir spinners)
- [x] Ações otimistas no PDV — item aparece no carrinho antes da API confirmar
      — *por desenho, não por `useOptimistic`: o carrinho é `useState` local
      (`pdv-client.tsx:99`) e a API só é chamada em `confirmSale`. O item entra
      na tela no clique.*
- [x] Lazy loading de módulos pesados (Relatórios, Financeiro)
      — *`ReportActions` importa `jspdf` + `jspdf-autotable` (~400 kB) e
      aparecia no bundle de 5 páginas. Agora entra por `LazyReportActions`
      (`next/dynamic`, `ssr: false`) em Relatórios, Financeiro, Estoque,
      Auditoria e recibo do PDV. Wrapper é Client Component porque Server
      Component importando Client Component não é code-split (guia local de
      lazy loading).*
- [x] Debounce na busca de produtos (300ms) — não disparar a cada tecla
- [x] Cache local das últimas consultas de produto (evitar re-fetch desnecessário)
      — *`GlobalSearch.tsx:78` guarda a última consulta em localStorage com
      timestamp.*

### 2.3 Onboarding

- [x] Tela de boas-vindas no primeiro acesso com nome do operador
      — *`OnboardingWelcome`: primeiro nome do operador, uma vez por
      dispositivo (localStorage), com CTA para Cadastrar produto.*
- [x] Checklist de 3 passos: cadastrar produto → realizar venda → ver relatório
      — *`OnboardingChecklist`, no `/dashboard`. "Produto" e "venda" são
      **contagens reais do banco** (`products > 0`, vendas concluídas
      históricas) — quem já vendia antes abre com o passo cumprido, sem
      tarefas inúteis. Só "abriu relatórios" é estado de dispositivo, porque
      é descoberta, não operação. Some quando os três acabam.*
- [~] Tooltips contextuais nos módulos novos (aparecem uma vez, dispensáveis)
      — *parcial: os tooltips existem e são dispensáveis, mas aparecem sempre,
      não só na primeira vez. A "primeira vez" ficou coberta pela tela de
      boas-vindas, que é uma vez só — não por tooltip.*
- [x] Estado vazio com CTA — nunca deixar tela em branco sem orientação
      — *`EmptyState` já aceitava a prop `action` desde sempre e **nenhum dos
      22 usos a passava**. Aplicada em 7 telas com saída correta por caso:
      filtro sem resultado → "Limpar filtros"; sem produto → "Cadastrar
      produto"; sem venda → "Registrar venda". "Estoque ok" e logs de
      auditoria seguem sem CTA de propósito: não são tela vazia, são ausência
      de problema.*

### 2.4 Retenção

- [x] Changelog in-app — painel "O que há de novo" com badge de novidade no menu
      — *rota `/dashboard/novidades` + item no menu com badge `new`. Lista
      estática versionada (`src/lib/changelog.ts`); "visto" em localStorage via
      `useSyncExternalStore` — a sidebar vive no layout e não remonta, então
      estado local ficaria preso num valor velho.*
- [x] Notificações internas — alertas de estoque baixo visíveis no dashboard
      — *`LowStockTable` no `/dashboard` + alerta de mínimo já auditado.*
- [x] Resumo diário no topo da Visão Geral: "Hoje você vendeu X itens e faturou R$ Y"
      — *coberto pelos `MetricCard` do `/dashboard` ("Faturado hoje" + nº de
      vendas), que já são tenant-scoped. **Não** reaproveitei o
      `DailySummary` aqui: ele não filtra por tenant (`getTodaySummary` conta
      `sale` sem `tenantId`), então colocá-lo no dashboard do tenant vazaria
      venda de outra loja. Ele só é usado no admin, onde a visão é de
      plataforma.*
- [x] Atalhos de teclado — `/` busca global, `N` novo produto, `V` nova venda
- [x] Feedback de ação sempre visível — toast de sucesso/erro em toda operação

**Critério de conclusão da Fase 2:** Tempo de navegação entre módulos abaixo de
200ms percebido. Taxa de conclusão do onboarding acima de 80%.

**Estado em 01/10/2026:** código da Fase 2 completo (20 de 20 itens, um deles
parcial). **Falta a medição dos dois critérios acima** — não há como afirmar
"200ms percebido" nem "80% de conclusão" sem instrumentação de telemetry, e
inventar número seria pior que deixar em aberto. O que dá para afirmar hoje:
168 testes / 22 suítes, `tsc` limpo, 4 gates de design system verdes, e o
`jspdf` saiu do bundle inicial de 5 páginas.

---

## Fase 3 — Funcionalidades de Alto Valor

> **Objetivo:** Features que justificam upgrade de plano e reduzem churn por dependência funcional.

### 3.1 PDV Avançado

- [ ] **Modo offline** — continua vendendo sem internet, fila de sync ao reconectar
      — **único item pendente da Fase 3.** É o item mais caro da fase: fila
      local, resolução de conflito na reconexão (o mesmo estoque vendido duas
      vezes) e idempotência. O `sale_idempotency` do PDV já dá a base.
- [x] **Leitor de código de barras** — câmera do celular via biblioteca JS (sem app nativo)
- [x] **Atalho de produto favorito** — fixar os 6 mais vendidos na tela do PDV
- [x] **Aplicação de desconto por item ou total** com senha de autorização
- [x] **Divisão de pagamento** — parte no dinheiro, parte no cartão
      — *split dinheiro/Pix + taxa de maquineta já no PDV Expresso.*

### 3.2 Estoque Inteligente

- [x] Mínimo de estoque configurável por produto
- [x] Alerta automático ao atingir mínimo (notificação in-app + e-mail opcional)
      — *alerta in-app sim; **e-mail opcional não existe*** — ver ressalva no
      fim da fase.
- [x] Histórico de movimentação por produto (entradas, saídas, ajustes)
- [x] Inventário com contagem física e ajuste de divergência

### 3.3 Relatórios e Financeiro

- [x] Gráfico de vendas por hora do dia (identificar picos)
- [x] Ranking dos 10 produtos mais vendidos do mês
- [x] DRE simplificado: receita − custo − despesas = lucro estimado
      — *tokenizado na Fase 1 (o verde hardcoded era ilegível no dark mode).*
- [x] Exportação de relatório em PDF com logo da loja
      — *PDF existe e agora entra por `LazyReportActions` (Fase 2). **Logo da
      loja no PDF não** — ver ressalva.*
- [x] Filtro por período customizado em todos os relatórios

### 3.4 Gestão de Equipe

- [x] Múltiplos usuários por loja com níveis de acesso:
  - Operador — acesso apenas ao PDV
  - Gerente — PDV + Estoque + Compras
  - Admin — acesso total
- [x] Log de auditoria — quem fez o quê e quando, com filtro por usuário
- [x] PIN rápido para troca de operador no PDV sem logout

**Ressalva sobre as marcações acima.** A auditoria que marcou estes itens é
por **busca no código**, não por inspeção no navegador — é o mesmo critério da
Fase 2. Três itens têm ressalva explícita: o alerta por e-mail não existe (só
o in-app), o PDF não tem logo da loja, e os perfis de acesso existem por
`requirePermission` mas não foram conferidos um a um contra a tabela de papel
acima. Estão marcados porque a functionality existe; se a Fase 3 for
concluída, esses três pontos merecem conferência visual antes de fechar o
critério.

**Critério de conclusão da Fase 3:** Pelo menos 3 funcionalidades desta fase em produção e com uso ativo medido.

---

## Fase 4 — Produto Elite / Escala

> **Objetivo:** Recursos que posicionam o BoraMais como a escolha premium do segmento.

### 4.1 Multi-loja

- [ ] Uma conta com N lojas, dados completamente separados por loja
- [ ] Dashboard consolidado — visão de todas as lojas em uma tela
- [ ] Transferência de estoque entre lojas
- [ ] Relatórios comparativos entre unidades

### 4.2 Integrações

- [ ] Integração com impressora térmica (Bluetooth) para cupom de venda
- [ ] Integração com gateway de pagamento (Pix, cartão via maquininha)
- [ ] Webhook para conectar com sistemas externos (ERP, contabilidade)
- [ ] API pública documentada para integrações customizadas

### 4.3 Inteligência e Automação

- [ ] Sugestão de compra automática baseada no histórico de vendas
- [ ] Previsão de ruptura de estoque ("este produto acaba em ~3 dias")
- [ ] Precificação dinâmica — sugestão de preço com base em margem configurada
- [ ] Relatório de produtos parados (sem venda há X dias)

### 4.4 Experiência de Elite

- [ ] App nativo (PWA instalável) com ícone na home screen
- [ ] Modo quiosque para PDV — tela dedicada sem acesso ao restante do sistema
- [ ] Backup automático com histórico de 30 dias e botão de restauração
- [ ] SLA de uptime na landing page + status page pública

**Critério de conclusão da Fase 4:** Produto posicionado com plano multi-loja ativo e pelo menos uma integração de pagamento funcionando.

---

## Visão Geral do Roadmap

```
FASE 1 — Visual          [████████████░░░░░░░░]  Em andamento
FASE 2 — UX & Retenção  [░░░░░░░░░░░░░░░░░░░░]  Aguarda Fase 1
FASE 3 — Features        [░░░░░░░░░░░░░░░░░░░░]  Aguarda Fase 2
FASE 4 — Elite & Escala  [░░░░░░░░░░░░░░░░░░░░]  Aguarda Fase 3
```

| Fase | Foco principal | Resultado esperado |
|---|---|---|
| 1 — Visual | Design system completo | Interface consistente, profissional |
| 2 — UX/Retenção | Fluidez e hábito | Usuário volta todo dia sem fricção |
| 3 — Features | Valor funcional | Dependência real do produto |
| 4 — Elite | Escala e diferenciação | Produto premium, difícil de substituir |

---

> **Regra do roadmap:** Não iniciar a próxima fase enquanto os critérios de conclusão da fase atual não forem cumpridos. Qualidade antes de volume.

*BoraMais Roadmap — v1.0 — Setembro 2026*
