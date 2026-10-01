# PROJECT_STATE — fonte da verdade

**Atualizado:** 01/10/2026 · **Fase:** **Fase 1 CONCLUÍDA** (1.1–1.4, com inspeção visual) · **Fase 2: código completo** (20 de 20 itens, 1 parcial) · Próxima: Fase 3 (modo offline)

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
- **Fase 1.1 fechada:** tokens em `tokens.css` como source of truth; contraste **WCAG AA 0 falhas em 42 pares** nos dois modos, auditado por `scripts/auditar-contraste.mjs`
- **Bug de cascata corrigido:** a regra `* { font-weight: 400 }` estava fora de `@layer` e anulava as utilitárias do Tailwind — o KPI em 700 do roadmap 1.3 **nunca renderizava** (caía para 400). Movida para `@layer base`; provado em Chromium
- **Fase 1.2 fechada:** 39 usos de `font-medium` (500) normalizados para `font-semibold` (600) em 31 arquivos; `.label-group` aplicada em `SidebarGroupLabel` (uppercase/10px/0.7px/600, verificado no Chromium); `aria-label="Toggle Sidebar"` (Title Case + inglês) corrigido para "Alternar barra lateral"
- **Critério de cor da Fase 1 cumprido:** **0 hex e 0 utilitárias de paleta** fora do token de marca, em 236 arquivos. Última violação era o DRE de `dashboard/financeiro` (`green-500`/`green-600`), agora tokenizado — o que de quebra corrigia um verde ilegível no dark mode
- **Código morto removido:** `.sidebar-overlay` no `globals.css` não era usado; a sidebar mobile já entrega overlay+blur+fechar-fora pelo `SheetContent` (Radix Dialog). `prefers-reduced-motion` passou a cobrir o Sheet
- **Gates permanentes:** `src/styles/tokens.test.ts` · `scripts/auditar-contraste.mjs` · `scripts/auditar-cores-hardcoded.mjs` · `scripts/auditar-sentence-case.mjs` · `scripts/verificar-pesos.mjs`
- **Integridade de migrations:** `.gitattributes` novo (migrations sempre em LF — `core.autocrlf` fazia 5/8 divergirem do checksum), BOM removido e checksum alinhado. `migrate status` limpo
- E2E `tests/e2e/admin-platform.spec.ts` (7 testes, só leitura)
- Item 8: fotos de produto via Storage (`src/lib/storage.ts`, setup em `docs/STORAGE.md`)

## Em desenvolvimento 🟡
- Nenhum.

## Não implementado ⬜
- Fases 3 (Features) e 4 (Elite) do roadmap — inventário real em
  `docs/boramais-roadmap.md`. Fase 3 falta **modo offline**; Fase 4 está
  praticamente do zero e exige decisão de produto (gateway, multi-loja)
- **Medição dos critérios de conclusão da Fase 2:** navegação abaixo de
  200 ms percebido e conclusão de onboarding acima de 80%. Exigem telemetry
  que o projeto não tem — registrados como pendentes, não preenchidos com
  número inventado
- `npx prisma migrate dev` segue quebrado: 7 modelos não têm migration que crie
  a tabela (`Promotion`, `PromotionItem`, `Supplier`, `Purchase`, `PurchaseItem`,
  `InventoryCount`, `InventoryCountItem`). Detalhes em
  `docs/changes/2026-09-29-integridade-migrations.md`
- Domínio + backup · logo própria (usa `BrandMark` atual)

## Bugs conhecidos
- Nenhum aberto.

## Pendência de segurança
- A senha do Postgres apareceu em claro na saída de um comando de terminal
  durante a sessão de 29/09 (não em arquivo versionado — `.env*` está no
  `.gitignore` e foi conferido). **Rotacionar a senha** e atualizar
  `DATABASE_URL`/`DIRECT_URL` no `.env` e `.env.local`.

## Próxima tarefa
- **Abrir a Fase 3** — falta só o **modo offline com fila de sync**, o
  único item pendente dela.
- Antes disso: decidir gateway de pagamento e modelo multi-loja, que travam
  a Fase 4 inteira. É decisão de negócio, não continuação natural.

## Notas de verificação
Baseline da Fase 1 (29/09): **150 testes / 20 suítes**, `tsc` limpo, `next build`
compilando, contraste 0 falhas em 46 pares, 0 checksums divergentes, e
**41/41 verificações na inspeção visual** com 0 erro de console.

Baseline da Fase 2 (01/10): **168 testes / 22 suítes**, `tsc` limpo, os 4
gates de design system verdes (contraste 0 falhas, 0 cor hardcoded, 0 violação
de sentence case, 0 peso fora de 400/600). `jspdf` saiu do bundle inicial de
5 páginas.

Detalhe de cada lote em `docs/changes/`.
