# PROJECT_CONTEXT — BoraMais Mobile

**Fase 0 — Imersão** · 02/10/2026 · Base: código atual + docs/PRD.md + docs/PROJECT_STATE.md + docs/backlog-pedidos-dono.md

---

## 1. O que o produto faz

BoraMais é um SaaS de gestão para conveniências (v1: conveniência/depósito de bebidas que vende direto ao consumidor final, sem revenda e sem fiado). Monólito Next.js 16 + Prisma + Supabase + Zod + shadcn/ui.

**Módulos operacionais:**
- **PDV** (clássico + express + offline): carrinho, pagamento (dinheiro, cartão, pix, split), desconto com senha, atacado automático, cupom não-fiscal
- **Caixa**: abertura, fechamento com diferença (sobra/falta), histórico
- **Estoque**: saldo por movimentação (ENTRADA/SAIDA/AJUSTE/PERDA/AVARIA), histórico, alertas de baixo estoque
- **Inventário**: contagem cega (TOTAL/PARCIAL), finalização
- **Produtos**: catálogo com foto, SKU, código de barras, preço de custo, atacado
- **Categorias**: PRODUTO e FINANCEIRO
- **Promoções**: PERCENTUAL, VALOR_FIXO, COMBO
- **Compras e Fornecedores**: registro de nota, status PENDING→RECEIVED
- **Financeiro**: lançamentos (RECEITA/DESPESA/TRANSFERENCIA), DRE, baixa paid/unpay
- **Relatórios**: vendas paginadas, financeiro, top produtos
- **Auditoria**: log de ações do tenant
- **Configurações**: regras de operação, taxa maquineta, logo
- **Modo offline**: fila de vendas no dispositivo, sincronização automática, divergências

**Admin plataforma (Super Admin):** empresas, planos, assinaturas, suporte (SLA), auditoria, saúde, configurações.

---

## 2. Quem usa no celular e em que situação

### Perfis de usuário (roles)

| Role | Hierarquia | Uso principal |
|---|---|---|
| **PROPRIETARIO** (Owner) | 1 | Acompanha tudo, configura, cadastra produtos |
| **GERENTE** (Manager) | 2 | Opera PDV, caixa, estoque, financeiro |
| **FINANCEIRO** | 3 | Lançamentos financeiros, DRE |
| **ESTOQUISTA** (Stock) | 4 | Movimenta estoque, inventário |
| **CAIXA** (Cashier) | 5 | Opera PDV e caixa |
| **FUNCIONARIO** (Staff) | 6 | Visão limitada (view) |
| **SUPER_ADMIN** | — | Admin da plataforma (não é tenant) |

### Situação de uso mobile

- **Operador de caixa (CAIXA/FUNCIONARIO)**: usa no celular **no balcão**, em pé, com uma mão, com pressa. A velocidade da venda é o que importa. PDV Expresso é a tela mais crítica.
- **Proprietário/Gerente**: usa no celular **fora do balcão** — para conferir vendas do dia, verificar estoque baixo, aprovar desconto, fechar caixa. Não tem pressa mas precisa de confiança nos números.
- **Estoquista**: usa no celular **no estoque/depósito**, para movimentar estoque, fazer inventário.
- **Financeiro**: usa no celular **na mesa**, para lançar despesas/receitas, dar baixa.

### O que o usuário não pode errar

1. **Troco** — total inconsistente entre telas faz o operador errar o troco e perder dinheiro real
2. **Venda duplicada** — vender offline, não ver o indicador e vender de novo
3. **Produto errado** — grade com nomes ambíguos ("Coca" duas vezes) faz o operador parar e perguntar ao cliente
4. **Desconto não autorizado** — senha de desconto hardcoded no cliente (bug conhecido)
5. **Cancelamento sem motivo** — cancelar venda sem registrar o motivo quebra a auditoria

---

## 3. As 5 tarefas mais frequentes do usuário mobile

| # | Tarefa | Tela | Frequência | Quem |
|---|---|---|---|---|
| 1 | **Vender (PDV Expresso)** | `/dashboard/pdv/express` | 50-200×/dia | Caixa/Funcionário |
| 2 | **Vender (PDV clássico)** | `/dashboard/pdv` | 20-50×/dia | Caixa/Gerente |
| 3 | **Ver vendas do dia** | `/dashboard/pdv` (lista) ou `/dashboard` | 5-10×/dia | Proprietário/Gerente |
| 4 | **Movimentar estoque** | `/dashboard/estoque` | 3-10×/dia | Estoquista/Gerente |
| 5 | **Abrir/fechar caixa** | `/dashboard/caixa` | 1-2×/dia | Caixa/Gerente |

**Fluxos raros (mas críticos):**
- Cancelar venda (com motivo + estorno)
- Inventário (contagem cega)
- Divergências offline (conciliação)
- Configurações (taxa maquineta, regras)

---

## 4. O que é crítico/irreversível

| Ação | Por que é crítico | Onde |
|---|---|---|
| **Venda confirmada** | Baixa estoque + atualiza caixa em transação. Se der errado, o dinheiro foi entregue e o estoque sumiu. | PDV clássico, PDV express, PDV offline |
| **Cancelamento de venda** | Reverte estoque e caixa. Sem motivo, a auditoria fica incompleta. | `/dashboard/pdv` → CancelSaleDialog |
| **Fechamento de caixa** | Diferença (sobra/falta) é registrada e não pode ser corrigida depois. | `/dashboard/caixa` → CloseCashBoxDialog |
| **Movimentação de estoque** | Nunca editada direto — só via StockMovement em transação. | `/dashboard/estoque` |
| **Desconto acima do permitido** | Senha hardcoded no cliente (bug conhecido). Qualquer funcionário pode descobrir. | PDV clássico e express |
| **Venda offline** | Fila local. Se o operador não ver o indicador, pode vender de novo e duplicar. | PDV offline + SyncIndicator |
| **Exclusão de lançamento financeiro** | Lançamento pago não pode ser editado/excluído — desmarcar o pago antes. | `/dashboard/financeiro` |

---

## 5. Vocabulário do negócio

O banco e o código falam português (valores de enum sem acento). A interface fala português por extenso. `src/lib/labels.ts` é a fonte única dos rótulos humanos.

### Termos da interface (enums → label)

| Enum | Label na UI |
|---|---|
| `CONCLUIDA` | Concluída |
| `CANCELADA` | Cancelada |
| `PENDENTE` | Pendente |
| `DINHEIRO` | Dinheiro |
| `CARTAO` | Cartão |
| `CREDITO` | Crédito |
| `DEBITO` | Débito |
| `PIX` | Pix |
| `TRANSFERENCIA` | Transferência |
| `CHEQUE` | Cheque |
| `ENTRADA` | Entrada |
| `SAIDA` | Saída |
| `AJUSTE` | Ajuste |
| `VENDA` | Venda |
| `DEVOLUCAO` | Devolução |
| `PERDA` | Perda |
| `AVARIA` | Avaria |
| `RECEITA` | Receita |
| `DESPESA` | Despesa |
| `ABERTO` | Aberto |
| `FECHADO` | Fechado |
| `CONCLUIDO` | Concluído |
| `PERCENTUAL` | Percentual |
| `VALOR_FIXO` | Valor fixo |
| `COMBO` | Combo |
| `PROPRIETARIO` | Proprietário |
| `GERENTE` | Gerente |
| `FINANCEIRO` | Financeiro |
| `ESTOQUISTA` | Estoquista |
| `CAIXA` | Operador de caixa |
| `FUNCIONARIO` | Funcionário |
| `SUPER_ADMIN` | Administrador da plataforma |

### Termos do PDV

- **Ticket**: lista de itens da venda em andamento
- **Carrinho**: itens selecionados (PDV clássico)
- **Atacado**: preço especial quando quantidade ≥ wholesaleMinQuantity
- **Taxa maquineta**: acréscimo cobrado do cliente no cartão (feeCredit/feeDebit)
- **Split**: divisão do pagamento entre dinheiro e pix
- **Troco**: valor recebido menos o total
- **Cupom não-fiscal**: recibo sem valor fiscal (couponSeq + couponDate)
- **Divergência**: venda offline que conflitou com estoque ou caixa

### Termos de navegação

- **Sidebar**: menu lateral (desktop)
- **BottomNav**: barra inferior (mobile) — Início, Estoque, PDV, Caixa, Finan.
- **FAB**: botão flutuante central (logo do BoraMais) no BottomNav
- **Sheet**: bottom sheet (mobile) ou drawer lateral (desktop)
- **ExpressShell**: contêiner imersivo do PDV Expresso (cobre header + bottom nav)

---

## 6. Dúvidas abertas — RESOLVIDAS (02/10/2026)

### 6.1. Sobre o modo mobile

1. **BottomNav vs Sidebar** ✅ **Resolvido**: o BottomNav tem 5 destinos fixos (Início, Estoque, PDV, Caixa, Finan.) e o PDV clássico não está lá — **é intencional**. O operador mobile usa o PDV Expresso.
2. **PDV clássico no mobile** ✅ **Resolvido**: a ideia é **otimizar o fluxo de escolha de produto e calculadora para valor**. Não aplicar quantidade na calculadora, mas na área de escolha de produto. O formulário de pagamento precisa ser repensado para mobile.
3. **PDV Expresso imersivo** ✅ **Resolvido**: o ExpressShell cobre header + bottom nav (z-60). **Deve ser melhorado**: precisa ter um **botão visível de cancelar** (hoje é um ✕ pequeno no canto superior esquerdo).
4. **Safe areas**: o AppShell tem `pb-[calc(5rem+env(safe-area-inset-bottom))]` para o BottomNav. O PDV clássico tem uma barra fixa em `bottom-16` que pode colidir com o BottomNav em alguns dispositivos.

### 6.2. Sobre o modo offline

5. **Indicador offline** ✅ **Resolvido**: a ideia é o **offline só funcionar quando não tiver rede**. O operador não deve ver indicador de offline se a rede está OK.
6. **Divergências**: a tela de divergências existe mas não tem notificação proativa. O gerente só vê se abrir a tela. Isso é intencional?

### 6.3. Sobre segurança

7. **Senha de desconto** ✅ **Resolvido**: **remover do código**. A senha hardcoded (`DISCOUNT_PASSWORD = "BoraMais2026"`) deve ser removida do cliente. Validação no servidor.
8. **PIN de troca de operador**: hardcoded "1234" no cliente. Mesmo problema da senha de desconto — **remover do código**.

### 6.4. Sobre o produto

9. **Escopo v1** ✅ **Resolvido**: `CREDITO` é **cartão de crédito** (não é fiado). Está ativo e é legítimo.
10. **Multi-loja** ✅ **Resolvido**: **atualmente 1 user = 1 empresa** (`User.tenantId` único). Multi-loja será suportado no futuro — o design mobile deve pensar em um seletor de loja, mas não é prioridade agora.

---

## 7. Paleta e design system (referência rápida)

- **Dia**: fundo branco `#FFFFFF`, primary laranja `#C45C2E` (brand) / `#BE592D` (primary para texto branco)
- **Escuro**: fundo preto `#0A0A0A`, cards `#141414`, primary branco `#FFFFFF`
- **Tipografia**: Inter (corpo) + Sora (display). Pesos: 400 (corpo), 600 (ênfase), 700 (KPI/números)
- **Espaçamento**: escala 4/8 (4, 8, 12, 16, 24, 32, 48)
- **Alvos de toque**: ≥ 44×44px (classe `hit-area-44` para expandir área clicável)
- **Safe areas**: `env(safe-area-inset-*)` respeitados no BottomNav, AppSheet, ExpressShell

---

## 8. Telas do projeto (mapa de rotas)

### Área do tenant (`/dashboard`)

| Rota | Tela | Uso mobile |
|---|---|---|
| `/dashboard` | Visão geral | Dashboard com KPIs |
| `/dashboard/produtos` | Produtos | Lista/catálogo com foto |
| `/dashboard/categorias` | Categorias | Lista |
| `/dashboard/estoque` | Estoque | Lista + movimentação |
| `/dashboard/inventario` | Inventário | Contagem cega |
| `/dashboard/pdv` | PDV clássico | Venda com carrinho |
| `/dashboard/pdv/express` | PDV Expresso | Venda rápida (imersivo) |
| `/dashboard/pdv/offline` | PDV sem conexão | Venda offline |
| `/dashboard/pdv/recibo/[id]` | Cupom | Recibo não-fiscal |
| `/dashboard/caixa` | Caixa | Abertura/fechamento |
| `/dashboard/financeiro` | Financeiro | Lançamentos + DRE |
| `/dashboard/compras` | Compras e Fornecedores | Registro de notas |
| `/dashboard/promocoes` | Promoções | Lista |
| `/dashboard/relatorios` | Relatórios | Vendas paginadas |
| `/dashboard/configuracoes` | Configurações | Regras da loja |
| `/dashboard/auditoria` | Auditoria | Log de ações |
| `/dashboard/divergencias` | Divergências offline | Conciliação |
| `/dashboard/novidades` | O que há de novo | Changelog |

### Área de autenticação

| Rota | Tela |
|---|---|
| `/login` | Entrar |
| `/signup` | Criar conta |
| `/unauthorized` | Sem permissão |

### Área admin (`/admin`)

| Rota | Tela |
|---|---|
| `/admin` | Visão geral |
| `/admin/empresas` | Empresas |
| `/admin/empresas/[id]` | Empresa 360 |
| `/admin/planos` | Planos |
| `/admin/assinaturas` | Assinaturas |
| `/admin/suporte` | Tickets |
| `/admin/notificacoes` | Comunicações |
| `/admin/auditoria` | Auditoria da plataforma |
| `/admin/saude` | Saúde |
| `/admin/configuracoes` | Configurações |
| `/admin/permissoes` | Permissões |
| `/admin/usuarios` | Usuários |

---

## 9. Componentes mobile existentes

| Componente | Arquivo | Uso |
|---|---|---|
| `BottomNav` | `src/components/shell/BottomNav.tsx` | Barra inferior (5 destinos + FAB) |
| `AppSheet` | `src/components/ui/app-sheet.tsx` | Bottom sheet (mobile) / drawer (desktop) |
| `ExpressShell` | `src/app/dashboard/pdv/express/_components/express-shell.tsx` | Contêiner imersivo do PDV Expresso |
| `SyncIndicator` | `src/components/offline/SyncIndicator.tsx` | Indicador de vendas pendentes |
| `NumericKeypad` | `src/app/dashboard/pdv/express/_components/numeric-keypad.tsx` | Teclado numérico (teclas 56px+) |
| `PressProductButton` | `src/app/dashboard/pdv/express/_components/press-product-button.tsx` | Botão de produto com long-press |
| `ProductTiles` | `src/app/dashboard/pdv/express/_components/product-tiles.tsx` | Grade de produtos (3 colunas) |
| `TicketSheet` | `src/app/dashboard/pdv/express/_components/ticket-sheet.tsx` | Ticket em sheet |
| `QuantitySheet` | `src/app/dashboard/pdv/express/_components/quantity-sheet.tsx` | Teclado de quantidade com presets |
| `LastItemStrip` | `src/app/dashboard/pdv/express/_components/last-item-strip.tsx` | Último item + stepper |
| `CartSheet` | `src/app/dashboard/pdv/_components/cart-sheet.tsx` | Carrinho em sheet (PDV clássico) |
| `ProductGrid` | `src/app/dashboard/pdv/_components/product-grid.tsx` | Grade de produtos (PDV clássico) |

---

## 10. Pendências conhecidas (do PROJECT_STATE.md)

- **43 testes falhando** em `src/lib/offline/queue.test.ts` (falta jsdom)
- **3 Selects sem nome acessível** em `/dashboard/produtos`
- **Verificação manual do modo offline** pendente
- **Alerta de estoque por e-mail** não existe (só in-app)
- **Perfis de acesso** não conferidos um a um contra a tabela de papel
- **Bloqueio de produto**: gateway de pagamento e modelo multi-loja travam a Fase 4

---

*Fim da Fase 0. Aguardando aprovação para iniciar a Fase 1 (Auditoria).*
