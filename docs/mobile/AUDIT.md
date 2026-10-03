# AUDIT — BoraMais Mobile

**Fase 1 — Auditoria** · 02/10/2026 · Base: screenshots em 390×844, 360×844, 430×844

---

## Resumo Executivo

| Métrica | Valor |
|---|---|
| Telas auditadas | 18 |
| Telas com scroll > 2 telas | 6 (33%) |
| Telas com scroll > 1.5 telas | 10 (56%) |
| Problemas 🔴 críticos | 8 |
| Problemas 🟠 altos | 15 |
| Problemas 🟡 médios | 12 |

**Padrão identificado:** a maioria das telas usa o mesmo layout desktop empilhado verticalmente — banner grande + cards KPI inflados + formulário + tabela. No mobile, isso gera scroll excessivo e empurra a ação principal para baixo.

---

## Tabela Completa por Tela

### 01. Login (`/login`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Entrar no sistema |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/01-login.png`

---

### 02. Dashboard (`/dashboard`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Visão geral do negócio |
| **Altura de scroll** | 2.42 telas |
| **Problemas** | 🔴 Modal de onboarding fraco (X no canto inferior esquerdo, sem backdrop, alvo < 44px). 🟠 Banner laranja grande (~25% da tela). 🟠 Cards KPI inflados. 🟡 Dois CTAs conflitantes (modal + FAB). |
| **Severidade** | 🟠 |
| **Solução** | Modal → bottom sheet com X no topo direito. Banner → compacto ou colapsável. KPI cards → compactos (1 linha). |

**Screenshot:** `screens/before/390/02-dashboard.png`

---

### 03. Produtos (`/dashboard/produtos`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver/gerenciar catálogo |
| **Altura de scroll** | 1.97 telas |
| **Problemas** | 🟠 Cards de produto grandes (foto + nome + preço + status + ações). 🟡 Formulário "Novo produto" em `<details>` (colapsado por padrão). |
| **Severidade** | 🟡 |
| **Solução** | Cards → compactos (foto + nome + preço + 1 ação). Formulário → bottom sheet ou tela cheia. |

**Screenshot:** `screens/before/390/03-produtos.png`

---

### 04. Categorias (`/dashboard/categorias`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver/gerenciar categorias |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/04-categorias.png`

---

### 05. Estoque (`/dashboard/estoque`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Movimentar estoque, ver saldo |
| **Altura de scroll** | 3.00 telas |
| **Problemas** | 🔴 Scroll excessivo (3 telas). 🟠 Cards KPI inflados (3 cards grandes). 🟠 Formulário "Movimentar estoque" empurrado para baixo. 🟡 Tabela de produtos com scroll. |
| **Severidade** | 🔴 |
| **Solução** | KPI cards → compactos (1 linha). Formulário → bottom sheet ou seção colapsável no topo. Tabela → lista de cards compacta. |

**Screenshot:** `screens/before/390/05-estoque.png`

---

### 06. Inventário (`/dashboard/inventario`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Fazer contagem de estoque |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/06-inventario.png`

---

### 07. PDV (`/dashboard/pdv`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Vender (clássico) |
| **Altura de scroll** | 2.61 telas |
| **Problemas** | 🔴 Botão "Cobrar" com contraste ruim (texto branco sobre bege). 🟠 Card de produto grande (foto + nome + categoria + preço + botão). 🟠 Formulário de pagamento 1,4 telas abaixo do catálogo. 🟡 Barra fixa de cobrança pode colidir com BottomNav. |
| **Severidade** | 🔴 |
| **Solução** | Botão Cobrar → cor primária (laranja). Cards → compactos. Formulário → repensar para mobile (ver decisão Fase 0: otimizar escolha de produto + calculadora). |

**Screenshot:** `screens/before/390/07-pdv.png`

---

### 08. PDV Expresso (`/dashboard/pdv/express`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Vender (rápido, no balcão) |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | 🔴 Teclado numérico cortado na borda inferior. 🔴 Toast "1 Issue" bloqueando o teclado. 🟠 Cards de produto grandes (3 por linha, avatar de letra grande). 🟠 Contraste ruim no ticket vazio (cinza sobre cinza). 🟡 Botão de fechar (X) pequeno no topo esquerdo. 🟡 Busca com placeholder confuso ("Bipe ou busque..."). |
| **Severidade** | 🔴 |
| **Solução** | Layout em 2 zonas fixas: produtos (scroll interno) + teclado/ticket (fixo). Toast → não bloquear teclado. Cards → compactos com foto. X → botão visível de cancelar (decisão Fase 0). |

**Screenshot:** `screens/before/390/08-pdv-express.png`

---

### 09. PDV Offline (`/dashboard/pdv/offline`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Vender sem conexão |
| **Altura de scroll** | 1.18 telas |
| **Problemas** | 🟡 Layout similar ao PDV clássico mas sem formulário de pagamento completo. 🟡 Banner "Vendendo sem conexão" pode ser mais compacto. |
| **Severidade** | 🟡 |
| **Solução** | Banner → compacto. Considerar layout mais enxuto. |

**Screenshot:** `screens/before/390/09-pdv-offline.png`

---

### 10. Caixa (`/dashboard/caixa`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Abrir/fechar caixa |
| **Altura de scroll** | 1.46 telas |
| **Problemas** | 🟠 Cards KPI inflados (3 cards grandes). 🟠 Ações "Abrir caixa" e "Fechar caixa" fora do alcance do polegar. 🟡 "Fechar caixa" cortado pela BottomNav. 🟡 FAB do PDV conflita com ação de "Abrir caixa". |
| **Severidade** | 🟠 |
| **Solução** | KPI cards → compactos. Ações → barra de ação fixa no rodapé ou bottom sheet. |

**Screenshot:** `screens/before/390/10-caixa.png`

---

### 11. Financeiro (`/dashboard/financeiro`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Lançar receitas/despesas, ver DRE |
| **Altura de scroll** | 2.42 telas |
| **Problemas** | 🔴 Scroll excessivo (2.42 telas). 🟠 Cards KPI inflados (3 cards grandes). 🟠 DRE cortado pela BottomNav. 🟡 Formulário "Novo lançamento" em `<details>`. 🟡 Sem empty state (todos os valores R$ 0,00). |
| **Severidade** | 🔴 |
| **Solução** | KPI cards → compactos. DRE → seção compacta ou colapsável. Formulário → bottom sheet. Empty state → orientação clara. |

**Screenshot:** `screens/before/390/11-financeiro.png`

---

### 12. Compras (`/dashboard/compras`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Registrar compras de fornecedores |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/12-compras.png`

---

### 13. Promoções (`/dashboard/promocoes`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Criar/gerenciar promoções |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/13-promocoes.png`

---

### 14. Relatórios (`/dashboard/relatorios`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver vendas, financeiro, top produtos |
| **Altura de scroll** | 3.05 telas |
| **Problemas** | 🔴 Scroll excessivo (3.05 telas). 🟠 Cards KPI inflados. 🟠 Campos de data empilhados verticalmente. 🟡 Tabela de vendas com scroll. 🟡 Tabela de top produtos sem mobile-friendly. |
| **Severidade** | 🔴 |
| **Solução** | KPI cards → compactos. Campos de data → lado a lado. Tabelas → lista de cards. |

**Screenshot:** `screens/before/390/14-relatorios.png`

---

### 15. Configurações (`/dashboard/configuracoes`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Configurar regras da loja |
| **Altura de scroll** | 1.41 telas |
| **Problemas** | 🟡 Formulário longo com muitos campos. 🟡 Sem seções claras. |
| **Severidade** | 🟡 |
| **Solução** | Formulário → seções colapsáveis ou tela em etapas (stepper). |

**Screenshot:** `screens/before/390/15-configuracoes.png`

---

### 16. Auditoria (`/dashboard/auditoria`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver log de ações |
| **Altura de scroll** | 2.72 telas |
| **Problemas** | 🔴 Scroll excessivo (2.72 telas). 🟠 Cards de auditoria grandes (título + data + usuário + badge). 🟡 Texto truncado (usuário "luizmarcelo31..."). |
| **Severidade** | 🔴 |
| **Solução** | Cards → compactos (1-2 linhas). Texto truncado → tooltip ou expansão. |

**Screenshot:** `screens/before/390/16-auditoria.png`

---

### 17. Divergências (`/dashboard/divergencias`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver divergências do modo offline |
| **Altura de scroll** | 1.00 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/17-divergencias.png`

---

### 18. Novidades (`/dashboard/novidades`)

| Campo | Valor |
|---|---|
| **Tarefa do usuário** | Ver changelog |
| **Altura de scroll** | 1.09 telas |
| **Problemas** | Nenhum identificado |
| **Severidade** | — |
| **Solução** | — |

**Screenshot:** `screens/before/390/18-novidades.png`

---

## Ranking de Telas (Frequência × Severidade)

| # | Tela | Frequência | Severidade | Score | Ordem de Execução |
|---|---|---|---|---|---|
| 1 | **PDV Expresso** | 50-200×/dia | 🔴 Crítica | 100 | **1º** |
| 2 | **PDV clássico** | 20-50×/dia | 🔴 Crítica | 80 | **2º** |
| 3 | **Estoque** | 3-10×/dia | 🔴 Crítica | 60 | **3º** |
| 4 | **Relatórios** | 1-3×/dia | 🔴 Crítica | 40 | **4º** |
| 5 | **Auditoria** | 1-2×/dia | 🔴 Crítica | 30 | **5º** |
| 6 | **Financeiro** | 2-5×/dia | 🔴 Crítica | 35 | **6º** |
| 7 | **Dashboard** | 5-10×/dia | 🟠 Alta | 25 | **7º** |
| 8 | **Caixa** | 1-2×/dia | 🟠 Alta | 20 | **8º** |
| 9 | **Produtos** | 2-5×/dia | 🟡 Média | 10 | **9º** |
| 10 | **PDV Offline** | 0-1×/dia | 🟡 Média | 5 | **10º** |
| 11 | **Configurações** | 0-1×/semana | 🟡 Média | 3 | **11º** |
| 12 | **Categorias** | 0-1×/semana | — | 1 | — |
| 13 | **Inventário** | 0-1×/mês | — | 1 | — |
| 14 | **Compras** | 0-1×/semana | — | 1 | — |
| 15 | **Promoções** | 0-1×/semana | — | 1 | — |
| 16 | **Divergências** | 0-1×/mês | — | 1 | — |
| 17 | **Novidades** | 0-1×/mês | — | 1 | — |
| 18 | **Login** | 1×/dia | — | 1 | — |

---

## Ordem de Execução Sugerida

### Prioridade Imediata (PDV — impacto direto no faturamento)

1. **PDV Expresso** — tela mais usada, teclado cortado, toast bloqueando, cards grandes
2. **PDV clássico** — botão Cobrar com contraste ruim, formulário fora de alcance

### Prioridade Alta (Gestão diária)

3. **Estoque** — scroll excessivo (3 telas), formulário empurrado para baixo
4. **Financeiro** — scroll excessivo (2.42 telas), DRE cortado
5. **Relatórios** — scroll excessivo (3.05 telas), campos de data empilhados

### Prioridade Média (Gestão semanal)

6. **Auditoria** — scroll excessivo (2.72 telas), cards grandes
7. **Dashboard** — modal fraco, banner grande
8. **Caixa** — ações fora do alcance do polegar

### Prioridade Baixa (Configuração)

9. **Produtos** — cards grandes
10. **PDV Offline** — banner compacto
11. **Configurações** — formulário longo

---

## Padrões Identificados (Problemas Repetitivos)

### 1. Cards KPI inflados (8 telas)

**Telas:** Dashboard, Estoque, Financeiro, Caixa, Relatórios, Auditoria, Produtos, PDV

**Problema:** Cards com padding excessivo, número grande, texto auxiliar pequeno. Ocupam 25-30% da tela cada.

**Solução padrão:** Cards compactos em grid 2×2 ou 3×1, com número em fonte menor e texto auxiliar inline.

### 2. Formulário em `<details>` (5 telas)

**Telas:** Estoque, Financeiro, Caixa, Produtos, Promoções

**Problema:** Formulários colapsados por padrão em `<details>`. O usuário precisa expandir para ver os campos.

**Solução padrão:** Bottom sheet ou tela cheia para formulários. Se manter na página, usar seção colapsável com indicador claro.

### 3. Tabela desktop empilhada (6 telas)

**Telas:** Estoque, Financeiro, Relatórios, Auditoria, Produtos, Caixa

**Problema:** Tabelas desktop com muitas colunas empilhadas verticalmente no mobile.

**Solução padrão:** Lista de cards compactos (coluna mais importante vira título, 1-2 dados de apoio, ação principal visível).

### 4. Banner laranja grande (12 telas)

**Telas:** Todas as telas com `PageHeader`

**Problema:** Banner laranja com título + badge + descrição ocupa ~20-25% da tela.

**Solução padrão:** Banner compacto (1 linha) ou colapsável. Manter apenas título + badge.

### 5. BottomNav com 5 destinos fixos (todas as telas)

**Problema:** BottomNav sempre visível, mesmo em telas onde não é necessário (ex: PDV Expresso imersivo).

**Solução padrão:** Manter BottomNav, mas considerar esconder em telas de fluxo (PDV, Caixa).

---

## Próximo Passo

**Fase 2 — PRD Visual** para as telas priorizadas:

1. PDV Expresso
2. PDV clássico
3. Estoque
4. Financeiro
5. Relatórios

Aguardando aprovação para prosseguir.

---

*Fim da Fase 1. Screenshots em `docs/mobile/screens/before/`.*
