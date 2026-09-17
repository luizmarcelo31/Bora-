# ADR-004 — Visual Studio Admin (branding)

**Data:** 17/09/2026 · **Status:** Aceita

## Contexto
Fase A entregou o Super Admin funcional com visual mínimo próprio. Para
identidade profissional sem desenhar do zero, avaliados Shadboard (Next 15,
NextAuth, i18n, Zod v3, pnpm) e Studio Admin
(`arhamkhnz/next-shadcn-admin-dashboard`, Next 16.3.5, Zod v4, npm, MIT).

## Decisão
Adotar o visual do Studio Admin, preset Neutral: `globals.css` (oklch),
`ui/*` (estilo radix-nova), shell sidebar no `/admin`, telas de auth como
base de `/login` e `/signup`, `BrandMark` como slot da logo. Licença MIT com
atribuição ao autor (Arham Khan / arhamkhnz).

## O que NÃO veio
Auth própria do kit (telas eram mock), sistema de preferências/temas
(ThemeBoot, stores zustand), dashboards e apps fora do escopo (crm,
ecommerce, kanban, mail...), Biome/Husky, scripts de presets (CSS copiados,
sem o gerador).

## Consequências
- Deps novas: `cn`, `radix-ui`, `tw-animate-css`, `shadcn`, `sonner`,
  `next-themes`, `react-hook-form`, `@hookform/resolvers`.
- `components.json` → radix-nova/neutral; aliases `@/lib`, `@/hooks`.
- Trocar de preset (ex.: tangerine) = ativar `data-theme-preset` (futuro).
- Trocar de kit exige novo ADR.
