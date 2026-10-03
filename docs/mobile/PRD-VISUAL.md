# PRD VISUAL — BoraMais Mobile

**Fase 2 — PRD Visual** · 02/10/2026 · Base: AUDIT.md + PROJECT_CONTEXT.md

---

## 1. PDV Expresso (`/dashboard/pdv/express`)

### Objetivo
Vender rápido no balcão: escolher produto, definir quantidade, cobrar.

**Ação primária única:** Confirmar venda.

### Wireframe

```
┌─────────────────────────────────────┐
│ ✕  PDV Expresso          [Caixa ▼] │  ← Header fixo (48px)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Bipe ou busque...     [⌨️]   │ │  ← Busca (56px)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ★ Mais vendidos  Bebidas  Cerveja│ │  ← Chips categoria (44px)
│ └─────────────────────────────────┘ │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ Foto│ │ Foto│ │ Foto│           │  ← Grade produtos
│ │Nome │ │Nome │ │Nome │           │    (3 colunas, scroll)
│ │R$12 │ │R$6  │ │R$12 │           │
│ │  +1 │ │  +2 │ │  +1 │           │
│ └─────┘ └─────┘ └─────┘           │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ ... │ │ ... │ │ ... │           │
│ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ▲ 3 itens · R$ 30,97  [Ver]    │ │  ← Ticket compacto (56px)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [QTD] [RECEBIDO]                │ │  ← Toggle (44px)
│ │  1   2   3                      │ │
│ │  4   5   6                      │ │  ← Teclado numérico
│ │  7   8   9                      │ │    (fixo, teclas 56px)
│ │  C   0   ⌫                      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ R$ 30,97          [CONFIRMAR]   │ │  ← Barra ação fixa (64px)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fluxo

```
[Produtos] → toque → [+1 no ticket]
                ↓
[Teclado QTD] → digita → [Quantidade selecionada]
                ↓
[RECEBIDO] → digita → [Valor recebido]
                ↓
[CONFIRMAR] → [Venda registrada] → [Limpa carrinho]
```

### Antes → Depois

| Antes | Depois |
|---|---|
| Busca com placeholder confuso | "Bipe ou busque..." com ícone de scan |
| Cards grandes (3 por linha, avatar letra) | Cards compactos (foto + nome + preço + badge qty) |
| Ticket acima do teclado | Ticket compacto fixo acima do teclado |
| Teclado cortado | Teclado fixo, sem corte |
| Toast bloqueando teclado | Toast não bloqueia (posição: topo) |
| X pequeno no topo esquerdo | Botão "Cancelar" visível no header |
| Sem indicador de caixa | Seletor de caixa no header |

### Estados

| Estado | Descrição |
|---|---|
| **Carregando** | Skeleton nos produtos e teclado |
| **Vazio** | "Toque num produto para começar" + ilustração |
| **Erro** | Toast vermelho no topo (não bloqueia teclado) |
| **Sucesso** | Toast verde "Venda #X registrada" + limpa carrinho |
| **Offline** | Banner "Sem conexão" + indicador de fila |

### Componentes e Tokens

| Componente | Arquivo |
|---|---|
| `ExpressShell` | `src/app/dashboard/pdv/express/_components/express-shell.tsx` |
| `ProductTiles` | `src/app/dashboard/pdv/express/_components/product-tiles.tsx` |
| `NumericKeypad` | `src/app/dashboard/pdv/express/_components/numeric-keypad.tsx` |
| `TicketSheet` | `src/app/dashboard/pdv/express/_components/ticket-sheet.tsx` |
| `QuantitySheet` | `src/app/dashboard/pdv/express/_components/quantity-sheet.tsx` |
| `LastItemStrip` | `src/app/dashboard/pdv/express/_components/last-item-strip.tsx` |
| `PressProductButton` | `src/app/dashboard/pdv/express/_components/press-product-button.tsx` |

**Tokens:** `--primary` (laranja), `--background`, `--card`, `--muted-foreground`, `--text-sm`, `--text-lg`

### Critérios de Aceite

- [ ] Venda de 1 item em até 3 toques (produto → confirmar)
- [ ] Sem scroll horizontal
- [ ] Teclado sempre visível e não cortado
- [ ] Ação principal (CONFIRMAR) no terço inferior
- [ ] Toast não bloqueia teclado
- [ ] Botão Cancelar visível no header
- [ ] Ticket sempre visível com total
- [ ] Alvos de toque ≥ 44px

---

## 2. PDV Clássico (`/dashboard/pdv`)

### Objetivo
Vender com carrinho revisável: escolher produtos, revisar, aplicar desconto, cobrar.

**Ação primária única:** Cobrar.

### Wireframe

```
┌─────────────────────────────────────┐
│ ←  PDV                   [Trocar 🔒] │  ← Header fixo (48px)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Buscar produto...            │ │  ← Busca (56px)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Favoritos: 6 chips]            │ │  ← Quick-add (44px)
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Catálogo                        │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐       │ │
│ │ │ Foto│ │ Foto│ │ Foto│       │ │  ← Grade produtos
│ │ │Nome │ │Nome │ │Nome │       │ │    (3 colunas, scroll)
│ │ │R$12 │ │R$6  │ │R$12 │       │ │
│ │ │  +1 │ │  +2 │ │  +1 │       │ │
│ │ └─────┘ └─────┘ └─────┘       │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐       │ │
│ │ │ ... │ │ ... │ │ ... │       │ │
│ │ └─────┘ └─────┘ └─────┘       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 2 itens · R$ 18,99   [Cobrar]  │ │  ← Barra fixa (64px)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fluxo

```
[Produtos] → toque → [+1 no carrinho]
                ↓
[Barra fixa] → toque "Cobrar" → [Bottom Sheet: Revisar]
                ↓
[Bottom Sheet] → [Editar itens] → [Aplicar desconto] → [Confirmar]
```

### Antes → Depois

| Antes | Depois |
|---|---|
| Card de produto grande | Card compacto (foto + nome + preço + qty) |
| Formulário de pagamento 1,4 telas abaixo | Bottom sheet com resumo + pagamento |
| Botão Cobrar com contraste ruim | Botão Cobrar com cor primária |
| Barra fixa pode colidir com BottomNav | Barra fixa acima do BottomNav (bottom-16) |
| Sem favoritos | Chips de favoritos (top 6 produtos) |

### Estados

| Estado | Descrição |
|---|---|
| **Carregando** | Skeleton nos produtos |
| **Vazio** | "Nenhum produto" + CTA cadastrar |
| **Erro** | Toast vermelho |
| **Sucesso** | Toast verde "Venda #X registrada" |
| **Offline** | Banner + fila |

### Componentes e Tokens

| Componente | Arquivo |
|---|---|
| `ProductGrid` | `src/app/dashboard/pdv/_components/product-grid.tsx` |
| `CartSheet` | `src/app/dashboard/pdv/_components/cart-sheet.tsx` |
| `SyncIndicator` | `src/components/offline/SyncIndicator.tsx` |

**Tokens:** `--primary`, `--background`, `--card`, `--muted-foreground`

### Critérios de Aceite

- [ ] Venda de 1 item em até 3 toques
- [ ] Sem scroll horizontal
- [ ] Barra fixa de cobrança sempre visível
- [ ] Bottom sheet para revisão e pagamento
- [ ] Botão Cobrar com cor primária (laranja)
- [ ] Alvos de toque ≥ 44px

---

## 3. Estoque (`/dashboard/estoque`)

### Objetivo
Movimentar estoque e ver saldo atual.

**Ação primária única:** Movimentar estoque.

### Wireframe

```
┌─────────────────────────────────────┐
│ ←  Estoque              [Busca 🔍]  │  ← Header fixo (48px)
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  3   │ │ 322  │ │  0   │         │  ← KPI compacto (3 col)
│ │Prod. │ │Unid. │ │Alert│         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Movimentar estoque              │ │  ← Seção colapsável
│ │ [Produto ▼] [Tipo ▼] [Qtd]     │ │    (abre por padrão)
│ │ [Motivo]                        │ │
│ │ [Registrar]                     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Saldo atual                     │ │
│ │ [Buscar...] [Filtrar]           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Produto    Qtd  Mín  Status │ │ │  ← Lista compacta
│ │ │ Coca-Cola  12   5    Ok     │ │ │
│ │ │ Heineken   8    5    Baixo  │ │ │
│ │ │ ...                         │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fluxo

```
[Seção Movimentar] → preenche → [Registrar] → [Toast sucesso]
                ↓
[Lista Saldo] → toque produto → [Bottom sheet: Editar estoque]
```

### Antes → Depois

| Antes | Depois |
|---|---|
| 3 KPI cards inflados | KPI compacto em 1 linha (3 colunas) |
| Formulário em `<details>` | Seção colapsável no topo (abre por padrão) |
| Tabela desktop | Lista de cards compactos |
| Scroll 3 telas | Scroll ~1.5 telas |

### Estados

| Estado | Descrição |
|---|---|
| **Carregando** | Skeleton na lista |
| **Vazio** | "Nenhum produto" + CTA cadastrar |
| **Erro** | Toast vermelho |
| **Sucesso** | Toast verde "Movimentação registrada" |

### Componentes e Tokens

| Componente | Arquivo |
|---|---|
| `MetricCard` | `src/components/shared/MetricCard.tsx` |
| `StatusBadge` | `src/components/shared/StatusBadge.tsx` |
| `FilterTabs` | `src/components/shared/FilterTabs.tsx` |

**Tokens:** `--primary`, `--card`, `--muted-foreground`, `--status-success-fg`, `--status-warning-fg`

### Critérios de Aceite

- [ ] Scroll ≤ 1.5 telas
- [ ] KPI compacto em 1 linha
- [ ] Formulário acessível sem scroll excessivo
- [ ] Lista de produtos compacta
- [ ] Alvos de toque ≥ 44px

---

## 4. Financeiro (`/dashboard/financeiro`)

### Obretivo
Lançar receitas/despesas e ver resultado.

**Ação primária única:** Lançar movimento.

### Wireframe

```
┌─────────────────────────────────────┐
│ ←  Financeiro           [Busca 🔍]  │  ← Header fixo (48px)
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │R$ 0  │ │R$ 0  │ │R$ 0  │         │  ← KPI compacto (3 col)
│ │Receita│ │Desp. │ │Saldo │         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ DRE                              │ │  ← DRE compacto
│ │ Receitas R$ 0 | Despesas R$ 0   │ │
│ │ Resultado: R$ 0                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Novo lançamento                 │ │  ← Seção colapsável
│ │ [Tipo ▼] [Categoria ▼] [Valor]  │ │
│ │ [Descrição] [Data]              │ │
│ │ [Lançar]                        │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Últimos lançamentos             │ │
│ │ [Buscar...] [Filtrar]           │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Descrição    R$ 100  Pago  │ │ │  ← Lista compacta
│ │ │ 02/10 Aluguel               │ │ │
│ │ │ ...                         │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fluxo

```
[Seção Novo lançamento] → preenche → [Lançar] → [Toast sucesso]
                ↓
[Lista] → toque lançamento → [Bottom sheet: Editar/Dar baixa]
```

### Antes → Depois

| Antes | Depois |
|---|---|
| 3 KPI cards inflados | KPI compacto em 1 linha |
| DRE cortado pela BottomNav | DRE compacto, sempre visível |
| Formulário em `<details>` | Seção colapsável no topo |
| Scroll 2.42 telas | Scroll ~1.5 telas |
| Sem empty state | Empty state com CTA |

### Estados

| Estado | Descrição |
|---|---|
| **Carregando** | Skeleton na lista |
| **Vazio** | "Sem lançamentos" + CTA "Lançar primeiro" |
| **Erro** | Toast vermelho |
| **Sucesso** | Toast verde "Lançamento registrado" |

### Componentes e Tokens

| Componente | Arquivo |
|---|---|
| `MetricCard` | `src/components/shared/MetricCard.tsx` |
| `StatusBadge` | `src/components/shared/StatusBadge.tsx` |

**Tokens:** `--primary`, `--card`, `--muted-foreground`, `--status-success-fg`, `--status-danger-fg`

### Critérios de Aceite

- [ ] Scroll ≤ 1.5 telas
- [ ] KPI compacto em 1 linha
- [ ] DRE sempre visível
- [ ] Formulário acessível sem scroll excessivo
- [ ] Empty state com CTA
- [ ] Alvos de toque ≥ 44px

---

## 5. Relatórios (`/dashboard/relatorios`)

### Objetivo
Ver vendas, financeiro e top produtos no período.

**Ação primária única:** Filtrar período.

### Wireframe

```
┌─────────────────────────────────────┐
│ ←  Relatórios           [Busca 🔍]  │  ← Header fixo (48px)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Início 📅] [Fim 📅] [Filtrar]  │ │  ← Filtro compacto (1 linha)
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  0   │ │R$ 0  │ │R$ 0  │         │  ← KPI compacto (3 col)
│ │Vendas│ │Fat.  │ │Saldo │         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Vendas no período               │ │
│ │ [Exportar PDF] [Compartilhar]   │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ #22  02/10  3it  R$ 30,97  │ │ │  ← Lista compacta
│ │ │ #21  02/10  2it  R$ 18,99  │ │ │
│ │ │ ...                         │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ [← Anterior] [1/5] [Próxima →] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Top produtos                    │ │
│ │ 1. Coca-Cola  12un  R$ 155,88  │ │
│ │ 2. Heineken   8un   R$ 103,44  │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Fluxo

```
[Filtro período] → seleciona → [Filtrar] → [Atualiza KPIs + listas]
                ↓
[Lista vendas] → toque venda → [Bottom sheet: Detalhes]
                ↓
[Top produtos] → toque produto → [Bottom sheet: Detalhes]
```

### Antes → Depois

| Antes | Depois |
|---|---|
| Campos de data empilhados | Campos de data lado a lado (1 linha) |
| 3 KPI cards inflados | KPI compacto em 1 linha |
| Tabela desktop | Lista de cards compactos |
| Scroll 3.05 telas | Scroll ~1.5 telas |
| Sem empty state | Empty state com CTA |

### Estados

| Estado | Descrição |
|---|---|
| **Carregando** | Skeleton nas listas |
| **Vazio** | "Sem vendas no período" + CTA ajustar filtro |
| **Erro** | Toast vermelho |
| **Sucesso** | Dados atualizados |

### Componentes e Tokens

| Componente | Arquivo |
|---|---|
| `MetricCard` | `src/components/shared/MetricCard.tsx` |
| `LazyReportActions` | `src/components/shared/LazyReportActions.tsx` |

**Tokens:** `--primary`, `--card`, `--muted-foreground`

### Critérios de Aceite

- [ ] Scroll ≤ 1.5 telas
- [ ] KPI compacto em 1 linha
- [ ] Filtro de período em 1 linha
- [ ] Lista de vendas compacta
- [ ] Empty state com CTA
- [ ] Alvos de toque ≥ 44px

---

## Padrões de Design System (referência)

### Cards KPI compactos

```
┌──────┐ ┌──────┐ ┌──────┐
│ Valor│ │ Valor│ │ Valor│  ← Número grande (24px, 600)
│ Label│ │ Label│ │ Label│  ← Texto pequeno (11px, muted)
└──────┘ └──────┘ └──────┘
```

### Lista compacta

```
┌─────────────────────────────────┐
│ Título                    R$ 0  │  ← Nome + valor
│ 02/10 · Categoria          Pago │  ← Data + categoria + status
└─────────────────────────────────┘
```

### Bottom sheet

```
┌─────────────────────────────────┐
│ Alça (mobile)                   │
│ Título                          │
│ Descrição                       │
│ ┌─────────────────────────────┐ │
│ │ Conteúdo com scroll         │ │
│ └─────────────────────────────┘ │
│ [Ação primária]                 │
└─────────────────────────────────┘
```

### Header fixo

```
┌─────────────────────────────────┐
│ ←  Título              [Ação]  │  ← 48px, sempre visível
└─────────────────────────────────┘
```

---

## Próximo Passo

**Fase 3 — Design System Mobile** para implementar os componentes base:
- Card compacto
- Lista-em-card
- Bottom Sheet
- Stepper
- Barra de ação fixa
- Header colapsável
- Chips
- Skeleton
- Estado vazio
- Toast

Aguardando aprovação para prosseguir.

---

*Fim da Fase 2.*
