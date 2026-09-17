# DESIGN_SYSTEM

- **Base:** Tailwind CSS v4 + shadcn/ui estilo New York, cor Slate (`components.json`).
- **Tokens:** `src/app/globals.css` (`--background`, `--primary`, `--muted`, `--border`, `--radius`... + dark mode).
- **Util:** `cn()` em `src/lib/utils.ts` (clsx + tailwind-merge).
- **UI:** `src/components/ui/` — button, input, card, table, badge.
- **Shared:** `src/components/shared/` — PageHeader, MetricCard, EmptyState.

## Regras
1. Reutilizar `ui/` e `shared/` antes de criar estilo novo.
2. Toda página: `PageHeader` + estados (loading/empty/error).
3. Componentes de módulo ficam junto ao módulo; só vai para `shared/` se usado em 2+ módulos.
4. Ícones: Lucide. Gráficos: CSS no MVP (Recharts adiado).
