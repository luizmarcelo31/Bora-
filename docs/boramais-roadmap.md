# BoraMais — Plano de Direção Visual & Roadmap de Produto

> Documento de referência para evolução do produto. Cada fase tem critério de conclusão claro antes de avançar para a próxima.

---

## 📌 Estado real (auditado em 29/09/2026)

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

### Fase 2 — ~60%
FEITO: loading.tsx, breadcrumb, foco visível, skeletons, debounce, EmptyState,
tooltips, atalhos de teclado, toasts, alerta de estoque baixo.
**Falta:** scroll restoration, lazy loading (`next/dynamic` = 0),
onboarding/boas-vindas (0), CTA dentro do EmptyState, changelog in-app (0).

### Fase 3 — ~85% (o mais avançado)
FEITO: leitor de código de barras, favoritos no PDV, desconto com senha, split
payment, estoque mínimo, alerta de mínimo, gráfico por hora, top 10 produtos,
DRE, PDF, filtro de período, níveis de acesso, log de auditoria, PIN de operador.
**Falta:** modo offline com fila de sync (0).

### Fase 4 — praticamente não iniciado
FEITO: nada relevante. "Produtos parados" tem 3matches (a verificar);
backup/restauração tem 2 (a verificar).
**Falta:** multi-loja, dashboard consolidado, transfer entre lojas, impressora
térmica, gateway de pagamento, webhook, API pública, sugestão de compra,
previsão de ruptura, precificação dinâmica, PWA instalável, modo quiosque,
status page.

### Ordem sugerida
1. Aplicar `.label-group` (fecha 1.2 — é o último item da Fase 1)
2. Auditar 1.4 módulo a módulo e ligar o overlay órfão da sidebar
3. Fase 2: onboarding + changelog + CTA no EmptyState
4. Fase 3: modo offline
5. Fase 4 exige decisão de produto e de gateway — não é continuation natural

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

- [ ] Transições de rota suaves — sem flash de tela branca ao trocar de módulo
- [ ] Sidebar com animação de abertura/fechamento (slide + overlay fade, 180ms)
- [ ] Scroll restoration — ao voltar de uma tela, manter posição da lista
- [ ] Breadcrumb contextual no header para módulos com sub-páginas
- [ ] Estado de foco visível ao navegar por teclado (acessibilidade)

### 2.2 Performance Percebida

- [ ] Skeleton loaders em todas as listas e KPI cards (substituir spinners)
- [ ] Ações otimistas no PDV — item aparece no carrinho antes da API confirmar
- [ ] Lazy loading de módulos pesados (Relatórios, Financeiro)
- [ ] Debounce na busca de produtos (300ms) — não disparar a cada tecla
- [ ] Cache local das últimas consultas de produto (evitar re-fetch desnecessário)

### 2.3 Onboarding

- [ ] Tela de boas-vindas no primeiro acesso com nome do operador
- [ ] Checklist de 3 passos: cadastrar produto → realizar venda → ver relatório
- [ ] Tooltips contextuais nos módulos novos (aparecem uma vez, dispensáveis)
- [ ] Estado vazio com CTA — nunca deixar tela em branco sem orientação

### 2.4 Retenção

- [ ] Changelog in-app — painel "O que há de novo" com badge de novidade no menu
- [ ] Notificações internas — alertas de estoque baixo visíveis no dashboard
- [ ] Resumo diário no topo da Visão Geral: "Hoje você vendeu X itens e faturou R$ Y"
- [ ] Atalhos de teclado — `/` busca global, `N` novo produto, `V` nova venda
- [ ] Feedback de ação sempre visível — toast de sucesso/erro em toda operação

**Critério de conclusão da Fase 2:** Tempo de navegação entre módulos abaixo de 200ms percebido. Taxa de conclusão do onboarding acima de 80%.

---

## Fase 3 — Funcionalidades de Alto Valor

> **Objetivo:** Features que justificam upgrade de plano e reduzem churn por dependência funcional.

### 3.1 PDV Avançado

- [ ] **Modo offline** — continua vendendo sem internet, fila de sync ao reconectar
- [ ] **Leitor de código de barras** — câmera do celular via biblioteca JS (sem app nativo)
- [ ] **Atalho de produto favorito** — fixar os 6 mais vendidos na tela do PDV
- [ ] **Aplicação de desconto por item ou total** com senha de autorização
- [ ] **Divisão de pagamento** — parte no dinheiro, parte no cartão

### 3.2 Estoque Inteligente

- [ ] Mínimo de estoque configurável por produto
- [ ] Alerta automático ao atingir mínimo (notificação in-app + e-mail opcional)
- [ ] Histórico de movimentação por produto (entradas, saídas, ajustes)
- [ ] Inventário com contagem física e ajuste de divergência

### 3.3 Relatórios e Financeiro

- [ ] Gráfico de vendas por hora do dia (identificar picos)
- [ ] Ranking dos 10 produtos mais vendidos do mês
- [ ] DRE simplificado: receita − custo − despesas = lucro estimado
- [ ] Exportação de relatório em PDF com logo da loja
- [ ] Filtro por período customizado em todos os relatórios

### 3.4 Gestão de Equipe

- [ ] Múltiplos usuários por loja com níveis de acesso:
  - Operador — acesso apenas ao PDV
  - Gerente — PDV + Estoque + Compras
  - Admin — acesso total
- [ ] Log de auditoria — quem fez o quê e quando, com filtro por usuário
- [ ] PIN rápido para troca de operador no PDV sem logout

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
