# PROJECT_STATE — fonte da verdade

**Atualizado:** 18/09/2026 · **Fase:** C e B concluídos (ver `docs/changes/2026-09-18-robustez-c-testes.md`)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn (48 `ui` + `shared`: PageHeader/MetricCard/
  EmptyState/BrandMark/FilterTabs/SearchParamToast/ReportActions/GlobalSearch) +
  `lib` (`payments`, `audit-labels`)
- Shell admin + tenant (sidebar, header com empresa + **busca global** + role);
  `GET /api/search` (produtos + categorias do tenant)
- Supabase Auth + `src/proxy.ts` + Prisma (4 migrations aplicadas, `migrate deploy` limpo)
- PDV: vender (preço do banco, batch, 4 pagamentos PT: Dinheiro/Pix/Crédito/Débito),
  erro honesto sem perder carrinho, cancelar com motivo + estorno, drawer vaul,
  idempotência validada
- Caixa, Estoque, Financeiro, Produtos, Categorias, Relatórios (com VENDAS do período),
  Configurações, Auditoria PT-BR com badges
- Impressão por tipo: LOG/VENDAS/FINANCEIRO/ESTOQUE (visualizar + PDF + share)
- Cache sem staleness: `React.cache` no auth, batch na venda, aggregates SQL
- Mobile 390px: 13/13 tabelas com scroll interno, `page-hscroll=false`
- E2E 50/50 no tenant 3 (scripts fora do repo — credencial; pendente versionar)

## Em desenvolvimento 🟡
- Nenhum. Item 8 (imagens/planos) adiado por decisão; 10A/10B ignorados.

## Concluído em 18/09 ✅
- Robustez C: erros honestos + `fail` em 6 rotas, audit best-effort com log,
  cancel preserva caixa fechada, anti-TOCTOU (caixa condicional, estoque revalidado na tx)
- Testes B: Vitest 23/23 + Playwright no repo (`smoke`, `navigation`, `mobile-tables`,
  `sale-flow` gated por `E2E_WRITE=1`); `min-w-0` anti-overflow nos layouts

## Não implementado ⬜
- Imagens de produto (Storage) · planos/assinaturas · domínio + backup · logo · dark toggle
- VENDAS cap 200 sem paginação; auditoria cap 100 sem filtro

## Bugs conhecidos
- Nenhum aberto. Dados `[TESTE]` mantidos no tenant 3 (vendas, caixas, categorias,
  estoque Coca-Cola 25l). Settings do tenant 3: controle ligado, sem negativo, desconto máx 10%.
- `_prisma_migrations` tem linhas failed antigas (marcadas rolled-back; `deploy` limpo).

## Próxima tarefa
1. C (robustez) → 2. B (testes no repo). Docs obrigatórios por lote (ver `AI_RULES.md`).
