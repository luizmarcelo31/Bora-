# ROADMAP

## Feito (fundação + Fases A/B + roadmap 1-7)
- [x] Next.js + Tailwind + shadcn base + Supabase clients
- [x] Prisma (2 migrations) + Validators + Services
- [x] APIs: test, tenants, products, users, sales, stock, cashbox, financial (sessão→tenant)
- [x] Auth UI + proxy + roles/permissions libs
- [x] Docs contínuos + Design System (Studio Admin, preset Neutral)
- [x] Super Admin (/admin) + conta raiz imutável
- [x] Produtos + Categorias + Estoque + PDV (c/ cancelar) + Caixa (c/ diferença) + Financeiro (c/ baixa)
- [x] Relatórios + Configurações + Auditoria (com trilha)

## Feito desde 18/09 (ver `docs/changes/2026-09-18-*.md`)
- [x] Kit UI em 10 rotas + toasts + Tabs + Empty/Item/Badge
- [x] PDV robusto (erro honesto, carrinho preservado) + pagamentos PT + auditoria PT-BR
- [x] E2E 50/50 (fora do repo) · cache sem staleness · mobile 390px · impressão por tipo · busca global

## Próximo
8. Imagens de produto (Supabase Storage) + planos/assinaturas (se necessário).
9. Testes no repo — [x] Vitest 23/23 + Playwright versionado (E2E 50/50 fora do repo como base).
10. Domínio (ignorado: sem domínio registrado; guia futuro em `docs/deploy/`) + backup (ignorado) + polish [x] (VENDAS paginada, rate-limit /api, dark toggle, auth negativa).
11. Robustez C — [x] concluído (ver changes).
