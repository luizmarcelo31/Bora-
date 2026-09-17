# ROADMAP

## Feito (fundação)
- [x] Next.js + Tailwind + shadcn base + Supabase clients
- [x] Prisma schema + migration inicial
- [x] Validators + Services
- [x] APIs: test, tenants, products, users, sales, stock, cashbox, financial
- [x] Auth UI + proxy + roles/permissions libs
- [x] Docs contínuos + Design System

## Próximo (semana 1–2)
1. Amarrar sessão→tenant (usar `getUserContextByEmail` nas APIs; exigir auth nas rotas).
2. Super Admin mínimo (listar/criar tenants, vincular usuários).
3. Produtos UI (lista + cadastro) com `X-Tenant-Id` → sessão.
4. Estoque UI (saldo + movimentar).

## Depois (semana 3+)
5. PDV UI + caixa (abrir/vender/fechar).
6. Financeiro UI (receitas/despesas + resumo).
7. Relatórios simples + auditoria.
8. Testes (Vitest unit + Playwright E2E nos fluxos críticos).
9. Deploy Vercel + domínio + backup.
