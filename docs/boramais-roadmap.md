# BoraMais — Plano de Direção Visual & Roadmap de Produto

> Documento de referência para evolução do produto. Cada fase tem critério de conclusão claro antes de avançar para a próxima.

---

## Fase 1 — Direção Visual (Agora)

> **Objetivo:** Estabelecer identidade visual sólida e consistente em 100% dos módulos antes de qualquer nova feature.

### 1.1 Paleta e Tokens

- [ ] Substituir todos os beges (`#F5F0EB`, `#FDEEE7` antigo) por branco puro `#FFFFFF`
- [ ] Substituir marrom/terracota escuro por preto `#111111` nos textos primários
- [ ] Aplicar laranja `#C45C2E` exclusivamente em: ativo, acento, botão primário, barra de KPI
- [ ] Implementar dark mode: fundo `#0A0A0A`, cards `#141414`, brand vira `#FFFFFF`
- [ ] Criar arquivo `tokens.css` centralizado (único source of truth de cores)
- [ ] Validar contraste WCAG AA em ambos os modos

### 1.2 Tipografia

- [ ] Definir escala tipográfica no código (title 22px → micro 10px)
- [ ] Remover variações de peso desnecessárias — usar só 400 e 600
- [ ] Padronizar todos os group labels: uppercase, 10px, letter-spacing 0.7px, `--text-3`
- [ ] Garantir sentence case em 100% da interface (sem Title Case em labels)

### 1.3 Componentes Base

- [ ] **Sidebar** — item ativo com barra laranja esquerda + fundo brand-light
- [ ] **Sidebar** — corrigir z-index (não abrir atrás do conteúdo)
- [ ] **Sidebar** — overlay escuro + blur ao abrir no mobile, fecha ao clicar fora
- [ ] **Header de página** — fundo laranja no day, fundo `#111` no dark
- [ ] **KPI Cards** — barra de acento 3px no topo, valor 28px/700, tag de detalhe
- [ ] **Tabela de produtos** — ícone colorido, dot de status, preço alinhado à direita
- [ ] **Filter chips** — estilo pill, ativo em laranja/day e branco/dark
- [ ] **Bottom nav** — fixo, safe-area, ativo em laranja/day e branco/dark
- [ ] **Botões** — primário, secundário, ghost, danger com estados hover/active/disabled
- [ ] **Inputs** — focus ring em laranja, placeholder em `--text-3`, label 12px/500
- [ ] **Badges** — 5 variantes: brand, success, warning, danger, neutral
- [ ] **Alertas / Banners** — 4 variantes com ícone + título + corpo

### 1.4 Revisão por Módulo

- [ ] Visão geral
- [ ] Produtos
- [ ] Categorias
- [ ] Estoque
- [ ] Inventário
- [ ] PDV
- [ ] Promoções
- [ ] Compras
- [ ] Caixa
- [ ] Financeiro
- [ ] Relatórios
- [ ] Configurações
- [ ] Auditoria

**Critério de conclusão da Fase 1:** Todos os módulos seguem os tokens e componentes do design system. Nenhuma cor hardcoded fora do `tokens.css`.

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
