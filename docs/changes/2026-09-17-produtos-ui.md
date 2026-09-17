# 2026-09-17 — Produtos UI (primeiro módulo comercial)

## O que mudou
- `requireSessionTenant()` em `src/lib/tenant.ts` (guarda p/ Server Components/Actions do tenant).
- `/dashboard/produtos`: tabela (nome, categoria, preço formatado, estoque, status),
  cadastro (nome*, preço R$*, custo R$, categoria, SKU, barcode, descrição) com
  conversão R$→centavos, ativa/desativa. Permissões via `requirePermission`
  (`products.create` / `products.update`).
- `ProductService.listProducts` aceita `active: "all"` (API sem filtro mantém default `true`).
- `/dashboard` com link p/ Produtos + `BrandMark`.

## Arquivos principais
`src/lib/tenant.ts`, `src/services/index.ts`, `src/app/dashboard/produtos/{page,actions}.ts`, `src/app/dashboard/page.tsx`, `docs/{MODULES,PROJECT_STATE}.md`.

## Testes
- `npx next build --webpack` verde (20 rotas).
- `/dashboard/produtos` sem sessão → 307.

## Efeitos colaterais
- Nenhum nas APIs (comportamento de `listProducts` sem filtro inalterado).
