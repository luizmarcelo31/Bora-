# PROJECT_STATE — fonte da verdade

**Atualizado:** 07/10/2026 · **Fase:** **Fase 1 CONCLUÍDA** (1.1–1.4, com inspeção visual) · **Fase 2: código completo** (20 de 20 itens, 1 parcial) · **Fase 3: 15 de 15** — modo offline implementado, aguardando verificação manual em navegador

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
- Fase 3 (Features): **15 de 15 itens implementados.** Modo offline entregue em
  02/10 (`docs/changes/2026-10-02-modo-offline-pdv.md`, `ADR-006`). Falta a
  **verificação manual em navegador** com rede caída — nenhum teste unitário
  cobre isso, e o critério de pronto é justamente comportamento offline
- **Fase 4 (Elite): do zero**, 15 itens, e exige decisão de produto (gateway
  de pagamento, modelo multi-loja) antes de qualquer ticket
- Fase 4 (Elite): do zero, 15 itens, e exige decisão de produto (gateway de
  pagamento, modelo multi-loja) antes de qualquer ticket
- **Medição dos critérios de conclusão da Fase 2:** navegação abaixo de
  200 ms percebido e conclusão de onboarding acima de 80%. Exigem telemetry
  que o projeto não tem — registrados como pendentes, não preenchidos com
  número inventado
- Domínio + backup · logo própria (usa `BrandMark` atual)
- **`npx prisma migrate dev` continua quebrado (P3006/P1014)** — mas o
  histórico de migrations agora **reconstrói o banco do zero** (28/28 tabelas
  verificadas em replay). O caminho oficial (`migrate diff` + `migrate deploy`)
  funciona. 7 causas raíz corrigidas em
  `docs/changes/2026-10-02-baseline-migrations.md`; a pendência que sobrou é
  defeito do shadow do Prisma 6.19.3 com Supabase, não do SQL

## Bugs conhecidos
- Nenhum aberto.

Corrigido em 08/10: **`ControlledSelect` não nomeava o campo.** O
`SelectTrigger` do Radix é `<button role="combobox">` e button não é
form-control nativo — um `<label>` envolvente rotula o hidden input, não ele. E
o placeholder é valor de estado, não rótulo: some quando há seleção. Três
call sites (PDV clássico, PDV Expresso, diálogo de fechar caixa) ficavam sem
nome acessível. `label` agora é **obrigatório** no tipo, e
`tests/e2e/accessible-names.spec.ts` mede a árvore de acessibilidade real em
28 rotas (68 campos) para isso não voltar.

Corrigido em 08/10: **venda offline podia ficar presa na fila com o dinheiro já
no banco.** `createSaleAction` devolvia `{error: "sale"}` para qualquer falha
inesperada — inclusive auditoria e revalidação, que acontecem DEPOIS do
create. O reconciliador tratava como erro desconhecido e **bloqueava** a
entrada. Observado: venda gravada com `offline=true` e a entrada da fila
correspondente presa, com `tentativas: 1`. Agora devolve `{error: "rede"}`, que
reenfileira; o reenvio bate na idempotencyKey e vira no-op. Verificado em
navegador: 7 vendas offline, **0 duplicação**, 0 perdida.

Corrigido em 08/10: **`auditar-cores-hardcoded.mjs` saía com status 0 mesmo
achando violação.** Imprimia o achado e não setava `exitCode` — qualquer coisa
que o envolvesse lia "ok". Por isso dois gates ficaram vermelhos no main sem
ninguém ver. Agora seta `exitCode = 1`.

Corrigido em 08/10: **43 testes do `src/lib/offline/queue.test.ts` estavam
falhando** (`TypeError: Cannot read properties of undefined (reading 'clear')` —
`window.localStorage` indefinido). O arquivo não existe mais no repositório:
a suíte hoje é 31 arquivos e **300 testes, todos verdes**. A pendência
registrada em 02/10 descrevia um estado que os 19 commits seguintes
resolveram; verificado com `npm test`, não por leitura.

Corrigido em 08/10: **contraste WCAG AA de volta a 0 falhas.** O botão
destrutivo no dark usava `#EF4444` sob texto branco (3.76:1, mínimo 4.5:1).
Escureci para `#D73D3D` (4.54:1) — o mesmo vermelho do light (`#DC2626`) já
passava com 4.83:1, então a divergência era o dark estar mais claro que o
light. Tokenizado também o `text-neutral-500`/`text-neutral-400` que sobrou no
PDV: `auditar-cores-hardcoded.mjs` volta a **0 utilitárias fora da marca em
295 arquivos**.

Corrigido em 07/10: **o menu oferecia item que a página rejeitava.** A sidebar e a
BottomNav listavam destinos fixos enquanto cada página barra com
`requirePermission` → `/unauthorized`. Para `FUNCIONARIO` eram 3 de 5 destinos
do mobile, **inclusive o FAB (PDV)** — que é a única navegação no celular.
`adminNav` isenta de filtro por desenho: `/admin` exige `SUPER_ADMIN` inteiro.
Prova em navegador nos dois roles: PROPRIETARIO 16/16 e 5/5, FUNCIONARIO 11/11
e 2/2, **zero 403**. Detalhe em
`docs/changes/2026-10-07-menu-permissao-tipografia.md`.

Corrigido em 08/10: **a escala de texto estava encolhida.** O `63ab5f2` pôs
`font-size: var(--text-body)` (14px) no `body`; como quase todo elemento não tem
utilitária de texto explícita, texto corrido, parágrafos e rótulos de tabela
herdavam 14px em vez de 16px — e `text-sm` (14px) ficava do mesmo tamanho do
corpo, apagando a distinção. Removido o `font-size` do `body` e a réplica
morta das utilitárias em `@layer components` (que também quebrava o
`tokens.test.ts`, agora **5/5 verde**). Medido em 1440px e 390px: escala
inteira no padrão do Tailwind. **Pesos e chrome não foram revertidos** — o
escopo definido pelo dono foi escala de texto.

## Acessibilidade — verificado no navegador (02/10/2026)
Auditoria real em 16 rotas (desktop 1249px + mobile 390px), com login e
medição no DOM. **Contraste: 0 violações WCAG AA.** **Overflow horizontal em
390px: nenhum.** **Inputs sem label: 0.** Corrigido neste dia:
- Estrutura de layers em `globals.css` (`:focus-visible` estava fora de
  `@layer` e sumia no build) — é o mesmo padrão do bug da Fase 1
- Alvos de toque: de 16 controles < 44px para **0** no mobile, com densidade
  do desktop preservada
- Detalhe em `docs/changes/2026-10-02-foco-e-alvos-de-toque.md`

## Pendência de segurança
- A senha do Postgres apareceu em claro na saída de um comando de terminal
  durante a sessão de 29/09 (não em arquivo versionado — `.env*` está no
  `.gitignore` e foi conferido). **Rotacionar a senha** e atualizar
  `DATABASE_URL`/`DIRECT_URL` no `.env` e `.env.local`.

## Próxima tarefa
- **Rodar `npm run gate:hook` depois de um `git clone`.** O `.git/hooks/` não é
  versionado, então a trava não viaja com o repositório. O instalador é
  idempotente e a lógica vive em `scripts/gate-design-system.mjs`, que é
  versionado. Sem isto, quem clona fica sem trava nenhuma — que foi como os
  gates ficaram vermelhos no main
- **Duas etapas do modo offline continuam manuais** (precisam de dois
  dispositivos ou de um operador): 2º aparelho vendendo o mesmo estoque
  enquanto o 1º está offline, e fechamento de caixa com pendência.
  `scripts/verificar-offline.mjs` cobre o resto e roda em 1 comando
- **Backlog de UX escrito da perspectiva do dono da conveniência:**
  `docs/backlog-pedidos-dono.md` — 9 itens priorizados com o cenário do dia a
  dia que faz cada um acontecer, mais a seção "O que NÃO mudar". Nenhum código
  foi alterado nesse lote; é documento para virar tarefa depois. Se for
  atacar um só, é **2.1 (total consistente entre PDV clássico e express)**:
  mexe no usuário todo dia, custa pouco, e é a diferença entre ele conferir a
  tela e confiar nela
- **Verificação manual do modo offline com rede caída** — a única coisa que
  falta para fechar a Fase 3. roteiro em
  `docs/changes/2026-10-02-modo-offline-pdv.md`; critérios abaixo
- **Três ressalvas da Fase 3 a conferir no navegador** antes de fechar o critério
  da fase: alerta de estoque por e-mail não existe (só in-app), o PDF de
  relatório não tem logo da loja, e os perfis de acesso existem por
  `requirePermission` mas não foram conferidos um a um contra a tabela de papel.
- **Bloqueio de produto, não de engenharia:** decidir gateway de pagamento e
  modelo multi-loja trava a Fase 4 inteira. Precisa de decisão de negócio.

## Documentei nesta sessão
- `docs/changes/2026-10-08-pendencias-e-gate-precommit.md` — as três pendências
  (nome acessível do `Select`, verificação do modo offline, `migrate dev`) e a
  trava de gate no pre-commit. Achou dois bugs de verdade: venda offline presa
  na fila com o dinheiro já no banco, e `auditar-cores-hardcoded.mjs` que
  imprimia violação e saía com status 0
- `docs/changes/2026-10-07-menu-permissao-tipografia.md` — menu por permissão na
  sidebar e na BottomNav (FAB marcado por flag em vez de índice), e a reversão
  da escala de texto: a causa era o `font-size` no `body`, não os tokens
  `--text-*` como o primeiro diagnóstico apontava
- `docs/changes/2026-10-02-modo-offline-pdv.md` — Fase 3.1 completa: 6 passos,
  as 4 políticas de conflito, o achado de migration que travava o banco, e o
  roteiro de verificação manual
- `docs/changes/2026-10-02-logo-pdf.md` — logo da loja nos 5 PDF e na impressão;
  troca do campo URL por upload do próprio dispositivo; fecha a ressalva de PDF
  da Fase 3. Ajuste fino do cabeçalho do PDF ficou pendente
- `docs/decisions/ADR-006-modo-offline-pdv.md` — escopo, 4 políticas de
  conflito (estoque, preço, caixa, sessão), 2 colunas novas em `Sale`
  (`offline`, `occurredAt`), e a justificativa de não usar service worker
- `docs/boramais-roadmap.md` — bloco "Visão Geral" reconciliado com o código
  (estava mostrando Fase 1 em andamento e Fases 2–4 aguardando); barras agora
  são por item, com as ressalvas que a barra esconde explicitadas

## Notas de verificação
Baseline da Fase 1 (29/09): **150 testes / 20 suítes**, `tsc` limpo, `next build`
compilando, contraste 0 falhas em 46 pares, 0 checksums divergentes, e
**41/41 verificações na inspeção visual** com 0 erro de console.

Baseline da Fase 2 (01/10): **168 testes / 22 suítes**, `tsc` limpo, os 4
gates de design system verdes (contraste 0 falhas, 0 cor hardcoded, 0 violação
de sentence case, 0 peso fora de 400/600). `jspdf` saiu do bundle inicial de
5 páginas.

Baseline da Fase 3.1 (02/10): **280 testes / 29 suítes** (+112), `tsc` limpo,
`next build` ok, os 4 gates de design system verdes, `prisma migrate status`
com histórico fechado. `verificar-pesos.mjs` estava quebrado por caminho de CSS
obsoleto do Next 16 — corrigido.

Ressalvas da Fase 3: **a do PDF com logo foi fechada** em 02/10. Restam duas —
alerta de estoque por e-mail (exige provedor, decisão de infraestrutura) e os
perfis de acesso não conferidos um a um.

**Pendência que só o navegador fecha:** venda offline nunca perder venda e
nunca duplicar na fila. Roteiro de 5 passos em
`docs/changes/2026-10-02-modo-offline-pdv.md`.

Detalhe de cada lote em `docs/changes/`.
