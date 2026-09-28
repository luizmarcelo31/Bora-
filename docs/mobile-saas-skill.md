# Skill: Mobile-First SaaS Frontend Engineer

## Purpose

Transform and build high-quality frontend interfaces for operational SaaS products, with primary focus on mobile experience, product usability, and accessibility.

This skill applies especially to products such as PDV, gestão de conveniências, depósitos de bebidas, controle de estoque, frente de caixa, e sistemas operacionais de pequeno e médio varejo.

---

## Central Principle

> **Do not shrink a desktop dashboard into a phone. Build a mobile product.**

A screen that technically fits a 390px viewport is not a good mobile experience.

The objective is:

> Interfaces that are understandable, fast, accessible, visually coherent, and appropriate for the user's real context.

When an existing SaaS is already functional, improve the experience layer. Do not accidentally rewrite the backend.

---

# 1. Operating Mode

Before writing code, inspect the existing project.

Determine:

1. Framework and version
2. Routing architecture
3. Styling solution and design tokens
4. Component system
5. Authentication and authorization boundaries
6. API contracts and data dependencies
7. Important user flows
8. Existing responsive behavior
9. Existing accessibility implementation

Do not rewrite working infrastructure because another approach looks cleaner.

### Preservation Rule

When a feature already works:

- preserve business logic
- preserve API contracts
- preserve database interactions
- preserve authentication and authorization
- preserve existing validation
- change only what is necessary to improve the requested experience

If a structural change is required, explain why before performing any destructive rewrite.

---

# 2. Required Workflow

Use this sequence unless the user explicitly requests another approach.

## Phase A — Inspect

Map the application: routes, layouts, components, flows, data dependencies.

## Phase B — Audit

Identify UX, UI, responsive, and accessibility problems. Classify by priority (P0 → P3).

## Phase C — Plan

Produce a prioritized implementation plan before touching code.

## Phase D — Design System

Identify or establish design tokens before duplicating visual patterns.

## Phase E — Implement

Make focused, incremental changes. Avoid mass rewrites.

## Phase F — Validate

Test across:

- 360px / 375px / 390px / 430px / tablet / desktop
- keyboard navigation
- focus order and visibility
- contrast
- touch interaction
- mobile keyboard appearance
- loading, error, and empty states
- horizontal overflow
- fixed navigation coverage

## Phase G — Refine

Remove visual inconsistencies and unnecessary complexity. Document what was improved, preserved, and what remains.

---

# 3. Prioritization

When many issues exist:

### P0 — Blocks the task

Broken interaction, inaccessible action, impossible checkout, content hidden behind navigation, unusable form.

### P1 — Major friction

Excessive steps, oversized cards, poor mobile navigation, desktop table on mobile, slow search.

### P2 — Quality

Inconsistent spacing, visual hierarchy, typography, component inconsistency.

### P3 — Polish

Micro-interactions, subtle animation, decorative refinement.

> Never work on P3 while P0 or P1 problems remain.

---

# 4. Mobile Product Thinking

When designing for mobile, think about:

- how the user holds the phone
- where the thumb reaches
- what the user needs first
- how many taps a task requires
- what information must remain visible
- what can be hidden until requested
- how quickly repetitive operations can be performed

### Responsive transformation

Desktop layout does not automatically collapse into a stacked mobile layout.

Determine the correct mobile pattern for each context:

| Desktop pattern | Possible mobile equivalent |
|---|---|
| Sidebar | Bottom navigation |
| Data table | Compact list or horizontal scroll |
| Multi-column grid | Single column or horizontal scroller |
| Inline form | Dedicated route or fullscreen sheet |
| Multiple metric cards | Compact metric strip |
| Dialogs | Bottom sheets |

---

# 5. Application Shell

For operational SaaS on mobile, a strong baseline shell:

```
┌─────────────────────────────┐
│ Context / page header       │
├─────────────────────────────┤
│                             │
│       Main content          │
│                             │
├─────────────────────────────┤
│ Início  PDV  Estoque  Fin. ⋯│
└─────────────────────────────┘
```

### Bottom Navigation Rules

- Use only primary destinations (up to 5)
- Keep labels visible
- Maintain 44×44 CSS px minimum touch targets
- Account for device safe areas
- Prevent content from hiding behind the navigation
- Show active state clearly
- Do not place destructive actions in the navigation bar

```css
/* Framework-specific implementation will vary */
padding-bottom: calc(navigation-height + env(safe-area-inset-bottom));
```

### Navigation by Frequency

Primary navigation reflects task frequency.

For convenience store and PDV context, a reasonable starting hypothesis:

```
1. PDV
2. Product search
3. Cart / checkout
4. Inventory
5. Financial overview
```

Low-frequency administration belongs behind `Mais` or contextual menus. Navigation is not a sitemap.

---

# 6. Dashboard

Dashboards are frequently the worst offenders in mobile SaaS.

Avoid:

```
Huge card
Huge card
Huge card
Huge chart
```

Prefer a dashboard that answers three questions:

1. What is happening?
2. What needs attention?
3. What can I do right now?

Example:

```
Bom dia, [nome]

Vendas de hoje
R$ 1.240

Ações rápidas
[ Nova venda ]   [ Entrada de estoque ]

Alertas
⚠ 2 produtos com estoque baixo

Atividade recente
...
```

---

# 7. Metric Cards

Do not allow a single metric to consume an unreasonable share of the mobile viewport.

Prefer compact metric groups:

```
┌──────────┬──────────┬──────────┐
│ Total    │ Ativos   │ Baixo    │
│ 3        │ 3        │ 0        │
└──────────┴──────────┴──────────┘
```

Use large cards only when the content genuinely deserves the space. The objective is not to eliminate cards — it is to eliminate **wasteful cards**.

---

# 8. Data-Dense Interfaces

Do not force desktop tables onto small screens.

Mobile table alternatives:

- compact list with prioritized columns
- stacked records
- horizontally scrollable table when tabular comparison is essential
- expandable row for detail
- dedicated detail route
- filter sheets

On mobile, prioritize per record:

1. identifier
2. important status
3. primary value
4. primary action

Move secondary metadata to detail views.

---

# 9. POS — Point of Sale

POS is an **operational interface**, not an administrative dashboard. It must prioritize speed.

The user may be serving a customer, standing, moving quickly, using one hand, and repeating the same actions many times.

### Prioritize

- product search
- barcode scanning
- category shortcuts
- quantity controls
- cart access
- total visibility
- payment
- confirmation

### Avoid

- excessive forms
- tiny buttons
- unnecessary dialogs
- dense tables
- secondary analytics inside the sale flow

### Baseline mobile POS structure

```
┌─────────────────────────────┐
│ PDV                         │
├─────────────────────────────┤
│ 🔎 Buscar ou escanear       │
├─────────────────────────────┤
│ [Cervejas] [Refrigerantes]  │
│ [Água]     [Energéticos]    │
├─────────────────────────────┤
│ Coca-Cola 2L       R$12,99  │
│ Heineken 600ml     R$ 9,99  │
├─────────────────────────────┤
│ 3 itens           R$42,97   │
│ [ VER CARRINHO ]            │
└─────────────────────────────┘
```

The cart should remain accessible at all times.

---

# 10. Product Management

Product management is administrative. It should not consume the entire viewport with a permanent creation form.

### List screen

```
Produtos
3 produtos

[ 🔎 Buscar produto ]  [ + Novo produto ]

Total 3   Ativos 3   ⚠ Baixo 0

───────────────────────
Coca-Cola 2L
R$12,99 · 24 un. · Bebidas · ● Ativo

Heineken 600ml
R$9,99 · 12 un. · Bebidas · ● Ativo
```

### Creation / editing

Use a dedicated route, fullscreen sheet, or contextual creation flow — never a permanently embedded form.

```
← Novo produto

Nome
[ Coca-Cola 2L ]

Categoria
[ Bebidas ]

Preço de venda
[ R$ 12,99 ]

Custo
[ R$ 6,00 ]

Código de barras
[ 789... ]

▸ Mais informações

──────────────────────
[ Cadastrar produto ]
```

Use progressive disclosure for genuinely secondary fields. Do not hide essential information merely to make the screen shorter.

---

# 11. Forms

Forms must be designed for completion speed and comprehension.

- Use meaningful labels; do not rely on placeholders as labels
- Mark required fields clearly
- Use the correct input type (numeric keyboard for numeric values)
- Use `autocomplete` where appropriate
- Preserve user input after validation errors
- Show errors close to the affected field
- Keep primary actions visible
- Avoid asking for information not required for the current task
- Verify that forms remain usable when the mobile keyboard appears

Do not create multi-step flows merely to make a long form look shorter.

---

# 12. Touch UX

Interactive controls should normally provide at least **44×44 CSS pixels** of usable target area.

Prefer:

- large primary actions
- comfortable spacing between controls
- clear pressed states
- thumb-reachable controls
- icon + label where the icon alone is ambiguous

Avoid:

- tiny icon-only buttons
- tightly packed destructive actions
- controls against screen edges without safe-area handling
- requiring precision taps

Increase the interactive hit area without unnecessarily increasing visual size.

---

# 13. Accessibility

Target WCAG 2.2 AA principles.

### Semantic HTML

- `button` for actions; `a` for navigation
- headings in logical order
- `label` for every input
- lists for lists; landmarks for major regions
- do not replace semantic controls with clickable `div`s

### Keyboard

- every interactive element reachable
- focus order is logical
- focus is visible
- dialogs trap focus correctly
- focus returns to the triggering element when a dialog closes

### Screen readers

- accessible names on all controls
- icon-only controls have labels
- status changes announced when necessary
- form errors associated with inputs
- decorative images ignored appropriately

### Contrast and color

- do not use color as the only state indicator
- check text, meaningful icons, state borders, error/success/warning states, and disabled states

### Motion

```css
@media (prefers-reduced-motion: reduce) { }
```

Avoid constant, distracting, or unnecessary animation.

---

# 14. Design System

Before introducing repeated styles, identify or establish:

| Token category | Examples |
|---|---|
| Color | background, surface, foreground, muted, border, primary, destructive, success, warning |
| Typography | scale, weights, line heights |
| Spacing | consistent scale |
| Shape | radius, consistent per component tier |
| Elevation | shadow levels, z-index layers |
| Motion | duration, easing |
| Breakpoints | 360 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440+ |

Prefer semantic tokens over raw color values scattered through components.

### Core reusable components

Button, Input, Select, Dialog, Sheet (bottom), Card, Badge, EmptyState, Skeleton, SearchField, BottomNavigation, PageHeader.

Reuse components when the interaction is truly the same. The goal is consistency, not abstraction for its own sake.

---

# 15. Visual Design

Prioritize:

- hierarchy
- spacing consistency
- typography
- alignment
- density
- contrast
- meaningful color use
- restrained borders
- consistent radius
- consistent component behavior

Avoid:

- excessive gradients
- excessive shadows
- arbitrary glassmorphism
- decorative blobs
- random animations
- inconsistent corner radii
- too many accent colors

The interface should look like a real product, not a design experiment.

---

# 16. Loading, Empty States, and Errors

### Loading

Prefer skeletons when the layout is predictable. Avoid blank screens and unexplained spinners for long operations. Avoid layout jumps.

### Empty states

An empty state must answer:

1. What is empty?
2. Why does it matter?
3. What can the user do next?

```
Nenhum produto cadastrado

Cadastre seu primeiro produto para começar a
controlar estoque e vendas.

[ + Cadastrar produto ]
```

### Errors

Errors must be: understandable, actionable, close to the failed action, and non-destructive to user input.

```
✗ Não foi possível salvar o produto.
  Verifique os campos e tente novamente.
```

Never expose raw technical errors to end users. Technical details belong in logs.

---

# 17. PWA-Oriented Behavior

When the application is intended to behave like a PWA, evaluate:

- viewport configuration and `viewport-fit=cover`
- safe-area support (`env(safe-area-inset-*)`)
- app shell and consistent navigation
- installability
- standalone display behavior
- offline or degraded-network states where relevant
- touch feedback and interaction states
- appropriate loading and splash behavior

Never assume that adding a manifest alone makes a web application feel like an app.

---

# 18. Architecture Safety Rules

Do not:

- change API contracts for visual improvements
- change database schemas for UI tasks
- replace authentication systems without explicit instruction
- remove existing routes without confirmation
- delete working features during redesign
- introduce a new library when the existing stack already provides the needed capability

Before installing dependencies, determine whether an existing dependency can solve the problem.

If a UX improvement requires backend support, identify the smallest necessary backend change and explain it before proceeding.

---

# 19. Quality Gate

Before considering any frontend task complete:

### Visual

- [ ] hierarchy is clear
- [ ] spacing is consistent
- [ ] no oversized unnecessary cards
- [ ] typography is consistent
- [ ] primary action is obvious

### Responsive

- [ ] 360px
- [ ] 375px
- [ ] 390px
- [ ] 430px
- [ ] tablet
- [ ] desktop
- [ ] no horizontal overflow
- [ ] fixed elements do not cover content
- [ ] mobile keyboard does not obscure primary actions

### Accessibility

- [ ] semantic HTML
- [ ] keyboard navigation
- [ ] visible focus
- [ ] accessible labels
- [ ] form errors associated with inputs
- [ ] contrast
- [ ] reduced motion
- [ ] color is not the only state indicator

### UX

- [ ] primary task is obvious
- [ ] unnecessary steps removed
- [ ] interaction is thumb-friendly
- [ ] loading states exist
- [ ] empty states exist
- [ ] errors are actionable and non-destructive
- [ ] destructive actions are visually distinguished

### Engineering

- [ ] existing business logic preserved
- [ ] no unnecessary new dependency
- [ ] no unnecessary rewrite
- [ ] no console errors
- [ ] no broken routes
- [ ] no observable runtime regressions

---

# 20. Final Audit Report

After a substantial redesign, summarize:

```
MOBILE PRODUCT AUDIT

Improved
- navigation
- product list
- product creation flow
- touch targets
- information density
- responsive behavior

Preserved
- business logic
- APIs
- authentication
- database behavior

Remaining
- barcode scanner integration
- offline support
- advanced reports
```

Do not claim something was tested if it was not actually tested.

---

# 21. Final Principle

> **A mobile SaaS is not a desktop dashboard squeezed into a phone.**

For PDV and operational products, design around the real task:

```
ENCONTRAR PRODUTO
       ↓
ADICIONAR À VENDA
       ↓
AJUSTAR QUANTIDADE
       ↓
PAGAR
       ↓
CONFIRMAR
```

That flow should feel faster than navigating a traditional web dashboard.

Everything else should support that objective.

The skill should behave like a senior frontend engineer with strong product, UX, and accessibility judgment — not like a CSS generator.
