# DESIGN_SYSTEM

- **Base:** Tailwind CSS v4 + shadcn/ui estilo `radix-nova`, cor Neutral, preset default (`components.json`). Visual originado do Studio Admin (ver `decisions/ADR-004-studio-admin-visual.md`).
- **Tokens:** `src/app/globals.css` (oklch, `--sidebar-*`, `--chart-*`, dark via `.dark`; presets brutalist/soft-pop/tangerine em `src/styles/presets/` reservados p/ futuro).
- **Util:** `cn()` do pacote `cn` nos componentes do kit; `cn()` + `getInitials()` em `src/lib/utils.ts` no código próprio.
- **UI:** `src/components/ui/` (25: button, input, card, table, badge, checkbox, field, label, select, separator, sheet, sidebar, dropdown-menu, avatar, sonner, skeleton, tooltip, collapsible, breadcrumb, dialog, scroll-area, textarea, switch, tabs, popover).
- **Shared:** `src/components/shared/` — PageHeader, MetricCard, EmptyState, BrandMark (slot da logo; prop `inverted` p/ fundo primary).
- **Admin:** `src/components/admin/` — AdminSidebar, NavMain, NavUser; rotas em `src/navigation/admin-nav.ts`.
- **Auth:** `src/components/auth/` — login-form, register-form (RHF + Zod v4, chamam as Server Actions Supabase).
- **Toast:** `Toaster` (sonner) + `TooltipProvider` no root layout.

## Regras
1. Reutilizar `ui/` e `shared/` antes de criar estilo novo.
2. Toda página: `PageHeader` + estados (loading/empty/error).
3. Componentes de módulo ficam junto ao módulo; só vai para `shared/` se usado em 2+ módulos.
4. Ícones: Lucide. Gráficos: CSS no MVP (Recharts adiado).
