# PROJECT_STATE — fonte da verdade

**Atualizado:** 27/09/2026 · **Fase:** E2E admin 7/7 verde + migration aplicada no remoto (item 8 código pronto, upload real pendente de teste manual)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn + `lib` (`payments`, `audit-labels`, `labels`, `plataforma`)
- Shell admin + tenant (sidebar, header com empresa + busca + `ThemeToggle` + role)
- Supabase Auth + `src/proxy.ts` (rate-limit 60/min em `/api/*`) + Prisma
- PDV: vender, cancelar com motivo + estorno, atacado automático, idempotência
- Caixa, Estoque, Financeiro, Produtos, Categorias, Relatórios (VENDAS paginadas 50/pág), Configurações
- Auditoria tenant com filtro servidor (q/acao) + paginação 50/pág
- Admin plataforma: empresas c/ paginação + MRR, empresa 360, planos, assinaturas (filtro + paginação), suporte SLA (filtro + paginação), auditoria (filtro + paginação), saúde `SELECT 1`
- Regras puras `src/lib/plataforma.ts`: `calcularMRR`, `calcularVencimentoSla`, `slaVencido`, `transicaoTicketValida`, `podeTransicionarAssinatura` + `plataforma.test.ts`
- `MODULES.md` sem duplicação; paginação/filtros documentados
- Lint 0 erros (só warnings em `docs/*.ts` snippets): `GlobalSearch` sem setState em efeito, `SearchParamToast` sem ref em render, `ThemeToggle`/`useIsMobile` com `useSyncExternalStore`, `&quot;` em dialog, `bootstrap-admin.cjs` com disable justificado, `verify-idempotency.ts` sem `any`
- E2E `tests/e2e/admin-platform.spec.ts` (7 testes, só leitura): guards deslogados passam local; resto exige `E2E_ADMIN_EMAIL/PASSWORD`
- Tenant 3 é `BoraMais Plataforma` (SUPER_ADMIN `luizmarcelodev@`): 14 vendas (1 `[TESTE]`), 3 produtos, 2 categorias, 4 caixas; settings com desconto on, máx 10, estoque controlado, sem negativo
- Migration `20260926000000` aplicada no remoto com fix (`OWNER`→`PROPRIETARIO`, `PIX`, `COMBO` mapeados — banco real tinha valores que o dev não tinha)
- E2E `admin-platform` 7/7 verde contra banco real; E2E achou e forçou fix de `"use server"` em todos `admin/**/actions.ts` (consts `ERROS_*` movidas para páginas, `mensagens.ts` para empresas)
- Item 8: fotos de produto via Storage (`src/lib/storage.ts` + `storage.test.ts`, `upload/removeProductImageAction`, miniaturas em produtos e PDV, setup em `docs/STORAGE.md`)

## Em desenvolvimento 🟡
- Nenhum. Item 8 (imagens/planos) fora do escopo por decisão.

## Não implementado ⬜
- Imagens de produto (Storage) · domínio + backup · logo própria (usa `BrandMark` atual)
- Dados `[TESTE]` mantidos no tenant 3 · `_prisma_migrations` com failed antigas (rolled-back; `deploy` limpo)
- E2E Playwright versionado parcial; base E2E 50/50 fora do repo

## Bugs conhecidos
- Nenhum aberto.

## Próxima tarefa
- E2E no repo para fluxos admin novos · limpeza dados `[TESTE]` se desejado.
