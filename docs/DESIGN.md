# BoraMais — Design (Fase 1: fundação)

> Preview aprovável: abrir `docs/design-preview.html` no navegador (toggle light/dark).
> Espelho máquina: `docs/design-tokens.json`. Fonte de verdade: `src/app/globals.css`.

## Rationale

O app parecia "template genérico shadcn" porque o tema era 100% monocromático
(`radix-nova/neutral`), Geist em tudo e nenhum asset próprio. A identidade
BoraMais assume o **calor do varejo de bairro**:

- **Papel quente** (`--background` amarelado) em vez de branco puro — acolhedor, menos clínico.
- **Tinta café** (`--foreground` com matiz) em vez de preto neutro — combina com o papel.
- **Tangerina** (`--primary` oklch(0.62 0.19 38), derivada do preset `tangerine`)
  como cor de ação e selo — energia de conveniência, visível de longe no PDV.
- **Dark "noturno"**: carvão quente + tangerina acesa (primary mais claro no dark,
  com texto café sobre ele para manter contraste).
- **Gráficos categóricos reais** (tangerina/âmbar/verde/azul/violeta) em vez de
  5 tons de cinza — dashboards legíveis à primeira vista.
- **Sora (display) + Inter (corpo)**: Sora geométrica e expansiva para títulos e
  números; Inter neutra e testada para tabelas densas e formulários.
- **Raio 0.75rem + sombras quentes**: assinatura tátil sem virar "slop"
  (sem gradiente gratuito, sem glassmorphism, sem animação de scroll).

## Tokens (onde vivem)

| Decisão | Arquivo |
|---|---|
| Paleta light/dark, charts, sidebar, radius, shadows, fonts | `src/app/globals.css` (`:root` + `.dark`) |
| `font-heading` → Sora, `font-sans` → Inter | `globals.css` (`@theme inline`) + `src/app/layout.tsx` (next/font) |
| Switcher `data-font` (sora/boramais + legados) | `globals.css` bloco `html[data-font]` |
| Alternativas futuras (brutalist/soft-pop/tangerine) | `src/styles/presets/` (intactos; especificidade maior vence) |
| Marca | `src/components/shared/BrandLogo.tsx` + `BrandMark.tsx` |

## Regras de uso

1. Números financeiros: `font-heading` + `tabular-nums` + `tracking-tight`.
2. Títulos de página/card: `font-heading` (herdado do `CardTitle`).
3. Corpo, tabelas, formulários: fonte padrão (Inter).
4. Ação primária = `primary` tangerina; destrutiva = `destructive`; sucesso = emerald via `StatusBadge` (semântico, fora dos tokens).
5. Sombras: usar utilitários `shadow-*` (agora ativos no default); nada de shadow hardcoded.
6. Não introduzir hex fora dos tokens; não usar `font-display` direto (o utility é `font-heading`).

## Efeito colateral consciente

Todo componente `ui/*` usa tokens semânticos, então o app inteiro muda de
cara sem tocar em nenhuma página — verificado via `npm run build` + E2E.
Ajustes por tela (StatCard, DataTable, selos por role) são Fase 2–4.

## Fase 2 — shell unificado (aplicada)

- `AppShell` (`components/shell/`): header único (trigger + contexto + busca
  opcional + tema + selo), `sidebar_state` lido uma vez. **Contrato: o padding
  do conteúdo pertence às páginas** (`max-w-6xl px-6 py-8` no CRUD,
  `@container + p-4 md:p-6` na home do dashboard).
- `AppSidebar({ homeHref, nav, user })`: mesma marca, só dados mudam
  (admin = selo "Super Admin" + `AdminSearch`; tenant = `tenant.name` + role + `GlobalSearch`).
- Tipos em `navigation/types.ts`; `admin-nav`/`tenant-nav` reexportam por compat.
- `AuthSplitLayout`: login/signup viram props (título/descrição/rodapé).

## Fase 3 — componentes de assinatura (aplicada)

- `MetricCard(+icon,+badge)`: gradiente `from-primary/5`, valor em Sora
  tabular; uso antigo (title/value/hint) intacto — 6 páginas ganham de graça.
- `TableCard(title,description,action?,toolbar?,footer?)`: envolve tabela ou
  EmptyState; adotado em empresas, usuários, produtos e PDV (vendas de hoje).
- `PageHeader(+actions)`: h1 em Sora bold; `EmptyState(+action)` com mídia
  em `primary/10`.

## Fase 4 — telas-modelo (aplicada)

- `dashboard/page`: 4 Cards bespoke → `MetricCard` (−90 linhas).
- `admin/page`: `MetricCard` com ícones + hints de plataforma.
- PDV "Vendas de hoje" → `TableCard` com contagem; `admin/usuarios`:
  selects nativos → `SelectField`; `admin/empresas`: filtro `?q`
  (alimenta a `AdminSearch`).
