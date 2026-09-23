# DESIGN_SYSTEM

- **Base:** Tailwind CSS v4 + shadcn/ui estilo `radix-nova`. Identidade **BoraMais** (Fase 1): papel quente, tinta café, primary tangerina, Sora (display) + Inter (corpo) — rationale em `docs/DESIGN.md`, preview em `docs/design-preview.html`, espelho em `docs/design-tokens.json`. Visual originado do Studio Admin (ver `decisions/ADR-004-studio-admin-visual.md`).
- **Tokens:** `src/app/globals.css` (oklch, `--sidebar-*`, `--chart-*` categóricos, `--font-display`, `--shadow-*` quentes, dark `.dark` noturno; presets brutalist/soft-pop/tangerine em `src/styles/presets/` como alternativas).
- **Util:** `cn()` do pacote `cn` nos componentes do kit; `cn()` + `getInitials()` em `src/lib/utils.ts` no código próprio.
- **UI:** `src/components/ui/` (25: button, input, card, table, badge, checkbox, field, label, select, separator, sheet, sidebar, dropdown-menu, avatar, sonner, skeleton, tooltip, collapsible, breadcrumb, dialog, scroll-area, textarea, switch, tabs, popover).
- **Shared:** `src/components/shared/` — PageHeader (+actions), MetricCard (icon/badge), TableCard, EmptyState (+action), BrandMark + BrandLogo ("B" tangerina; prop `inverted` p/ fundo primary), GlobalSearch, StatusBadge, TableToolbar, FilterTabs.
- **Shell:** `src/components/shell/` — AppShell (header único, cookie sidebar_state), AppSidebar (sidebar única por dados), NavMain, NavUser. Wrappers finos: `components/admin/AdminSidebar` + `components/tenant/TenantSidebar`. Tipos em `src/navigation/types.ts` (nav files só exportam dados).
- **Admin:** `src/components/admin/` — AdminSearch (rotas locais + `?q=` em empresas); rotas em `src/navigation/admin-nav.ts`.
- **Auth:** `src/components/auth/` — AuthSplitLayout + login-form/register-form (RHF + Zod v4, Server Actions Supabase).
- **Toast:** `Toaster` (sonner) + `TooltipProvider` no root layout.

## Regras
1. Reutilizar `ui/` e `shared/` antes de criar estilo novo.
2. Toda página: `PageHeader` + estados (loading/empty/error).
3. Componentes de módulo ficam junto ao módulo; só vai para `shared/` se usado em 2+ módulos.
4. Ícones: Lucide. Gráficos: CSS no MVP (Recharts adiado).
