# Mobile UX Spec — BoraMais

Documento vivo da experiência mobile do tenant operacional. Base: `docs/mobile-saas-skill.md`.
Princípio central: **não é dashboard espremido — é produto mobile**.

## 1. Shell (todas as rotas tenant)

- **BottomNav M3** (`src/components/shell/BottomNav.tsx`): 5 destinos, labels sempre visíveis, `min-h-14` (56px), pill `bg-primary/15` no ativo, `aria-current="page"`, safe-area `env()` no padding, `md:hidden`.
- **FAB central** (índice 2): logo em círculo elevado (`-mt-5 size-14 ring-4`), `aria-label` com destino. Troca via `fabImage` + URL em `dashboard/layout.tsx`.
- **Sidebar desktop intacta**; mobile usa Sheet overlay. Conteúdo com `pb-[calc(5rem+env(safe-area-inset-bottom))]` no mobile para nunca esconder atrás da nav.
- **Header**: busca `w-28 → sm:w-52 → md:w-72`, label contexto oculta <480px, skip-link `#conteudo` primeiro foco.

## 2. Densidade (tokens + base)

- Container página: `px-4 py-5 gap-4` mobile → `md:px-6 md:py-8 md:gap-6`.
- Tabela: header `h-9 px-3`, célula `px-3 py-2.5`, `text-sm`, `tabular-nums` em todo número.
- Títulos: `PageHeader` `text-xl md:text-2xl`; `MetricCard` valor `text-2xl`; `text-xs` mínimo 11px.
- `TableCard` obrigatório em listagens: título + descrição + `footer "N registro(s)"`.

## 3. Padrões por contexto

| Desktop | Mobile | Onde |
|---|---|---|
| Tabela 4+ col | `<ul>` compacta: identificador + status + valor + ação primária; tabela `hidden md:block` | todas as listagens |
| Tabela ≤3 col estreita | mantém (cabe em 360px) | top produtos, categorias financeiras, saúde |
| Matriz (permissões) | scroll horizontal (comparação essencial) | admin/permissoes |
| Form criação permanente | `<details>` colapsável "+ Expandir" | produtos, compras, caixa/abrir, categorias, financeiro, promocoes, inventario |
| Dialog central `max-w-lg` | Sheet `bottom` phone / `right` desktop (`useIsMobile`) | edit produto, edit financeiro |
| Drawer carrinho | bottom phone / right desktop | PDV tradicional |
| Modal custom | proibido — sempre Radix (trap + Escape) | PIN migrado |
| Métricas | strip 2 col mobile (`grid-cols-2`), 4 col desktop | dashboard |

## 4. PDV Expresso (botão central)

Fluxo: buscar (Enter adiciona por barcode) → tap +1 → teclado QTD⇄RECEBIDO (teclas `min-h-14`) → ticket +/−/× → pagamento único/dividido → troco auto → CONFIRMAR.
- Sticky bar mobile total + confirmar (`bottom-20`, acima da nav) + spacer.
- Split só dinheiro+pix; taxa maquineta só cartão único, calculada no servidor.
- Desconto em `details`; senha com `role=alert`; toggles com `aria-pressed`; linha selecionada com `aria-current` + anel (nunca só cor).
- Pós-venda: toast com ação **Recibo** → cupom não-fiscal (mono, tracejado, SEM VALOR FISCAL) com print/PDF/share.

## 5. Toque e acessibilidade

- Alvo 44px: botões `sm`/ícone usam `.hit-area-44` (pseudo-elemento invisível, visual intacto); primárias com `min-h-11/12` reais.
- Labels em todo input; erros com `role="alert"` + `aria-invalid`; icon-only com `aria-label`; headings sem pular nível.
- `prefers-reduced-motion` zera animações; foco visível global; contraste AA auditado (mínimo 4.7:1 nos pares muted).
- Teclado: `/` busca, `n` produto, `v` PDV; hints no rodapé do search.

## 6. PWA

`manifest.ts` standalone, icons 192/512 + maskable (fundo extraído da logo) + apple 180, `viewport-fit=cover`, `theme-color #C45C2E`. Sem service worker (fora escopo atual).

## 7. Quality gate (antes de cada entrega mobile)

Visual: hierarquia, ritmo responsivo, sem card desperdiçado, ação primária óbvia. Responsivo: 360/375/390/430 + desktop, sem overflow, nada sob fixed. A11y: semântica, teclado, foco, labels, erros associados, contraste, motion, cor-nunca-sozinha. UX: tarefa ≤3 toques, loading/empty/error states, destrutivo distinguido. Engenharia: lógica preservada, sem dep nova, build+lint+tsc+testes verdes.

## 8. Restante conhecido

Device real, scanner de barras via câmera, offline, NFC-e/TEF, conciliação automática, fiado, fidelidade, sangria, PageShell central (recusado: churn), tabelas admin já cobertas exceto matriz/listas nativas.
