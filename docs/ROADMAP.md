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

## Feito em 27/09 (pendências, menos item 8)
- [x] Auditoria tenant: filtro servidor (q/acao) + paginação 50/pág
- [x] Admin auditoria: busca q + paginação 50/pág (antes `take: 200` fixo)
- [x] Suporte: busca q + paginação 20/pág (antes `take: 100` fixo)
- [x] Assinaturas: busca q + paginação 20/pág
- [x] `src/lib/plataforma.ts` + `plataforma.test.ts` (MRR, SLA 1h/4h/8h/24h, transições ticket/assinatura)
- [x] Segurança/polish confirmados: rate-limit `/api` no proxy, `requireSuperAdmin`, `ThemeToggle` no shell, `BrandMark`
- [x] Docs: `MODULES.md` sem duplicação, `PROJECT_STATE.md` atualizado

## Próximo
8. Imagens de produto — [x] upload no dialog de edição + miniaturas (catálogo e PDV); bucket por tenant via `docs/STORAGE.md`. Planos/assinaturas já prontos no admin.
9. Testes no repo — [x] Vitest + `plataforma.test.ts` + `storage.test.ts` + `labels.test.ts`; E2E admin novo pendente de credencial.
10. Domínio (ignorado: sem domínio registrado) + backup (ignorado) + polish [x] (VENDAS paginada, rate-limit /api, dark toggle, auth negativa).
11. Robustez C — [x] concluído (ver changes).

## Próximo
8. Imagens de produto (Supabase Storage) + planos/assinaturas (se necessário).
9. Testes no repo — [x] Vitest 23/23 + Playwright versionado (E2E 50/50 fora do repo como base).
10. Domínio (ignorado: sem domínio registrado; guia futuro em `docs/deploy/`) + backup (ignorado) + polish [x] (VENDAS paginada, rate-limit /api, dark toggle, auth negativa).
11. Robustez C — [x] concluído (ver changes).
