# AI_RULES

Regras obrigatórias para qualquer IA operando neste repo.

## Antes de codar (ordem mínima)
1. `docs/AI_RULES.md` (este arquivo)
2. `docs/PROJECT_STATE.md`
3. `docs/PRD.md`
4. Doc do módulo (`AUTH.md`, `TENANCY.md`, `PERMISSIONS.md`, `DATABASE.md`...)
5. Código existente → só então implementar.

## Banco, schema e migrations (leia antes de qualquer `prisma`)

O banco é **estado compartilhado e não volta atrás com o git**. Um clone
atrasado descreve um banco que já mudou, e o resultado é migration escrita
contra uma modelo obsoleto. Em 29/09/2026 isso custou uma migration que
tentou recriar tabelas (`Plan`, `Subscription`) que já existiam.

**Procedimento obrigatório antes de criar ou rodar migration:**

1. `git fetch origin` e conferir se `origin/main` está à frente do local.
   Roadmap e schema podem ter advances que o clone não tem.
2. `npx prisma migrate status` — confirma se a pasta de migrations bate com
   `_prisma_migrations`. Se aparecer migration no banco que não está na pasta
   (ou vice-versa), **pare**: o clone está desatualizado.
3. `node scripts/verificar-checksums.cjs` — detecta migration divergente.
   Divergência de checksum normalmente é `core.autocrlf` convertendo LF→CRLF,
   não edição humana. O `.gitattributes` deste repo já normaliza migrations
   em LF justamente para isso.

**Ao escrever migration:**

- Valores default de tabela e coluna vão **sem** aspas duplas.
- Nunca edite uma migration já aplicada: o Prisma guarda sha256 em
  `_prisma_migrations.checksum` e passa a acusar "modified after applied".
  Para corrigir bytes, use `node scripts/corrigir-migration-bom.cjs`, que
  imprime o SQL de rollback.

**Estado atual (02/10/2026) — RESOLVIDO, com ressalva:**

- O histórico de migrations **agora reconstrói o banco do zero**: replay das 12
  migrations em banco descartável cria **28/28 tabelas**. Verifique com
  `node scripts/replay-migrations.mjs` (ou `testar-shadow-real.mjs`, que faz
  num banco novo em vez de schema).
- `npx prisma migrate deploy` funciona e é o caminho oficial do projeto.
  Foi ele que aplicou `20260925000000_baseline_7_tabelas` e
  `20261002150000_product_wholesale`.
- **`npx prisma migrate dev` continua falhando** com P3006/P1014, e a causa
  **não é o SQL** (o replay passa inteiro, por pooler e por conexão direta).
  Passa-se uma sentinela `SELECT 1/0` numa migration anterior à que falha e ela
  não dispara: o Prisma 6.19.3 não executa as migrations novas no shadow contra
  Supabase, embora o log `DEBUG` mostre que lê a pasta. Sete variantes foram
  testadas (pooler, direta, `shadowDatabaseUrl`, `--create-only`, caches
  limpos) e nenhuma resolveu. **Use `migrate deploy`, nunca `migrate dev`, e
  nunca `migrate reset`.**
- Causas raiz que foram corrigidas (detalhe em
  `docs/changes/2026-10-02-baseline-migrations.md`): as 7 tabelas fora do
  histórico; a `20260926000000` que depende delas; os 4 enums antigos que
  nenhuma migration criava; a `20260929090000` que duplica a `20260926000000`;
  e `Product.wholesalePrice`/`wholesaleMinQuantity`, usadas pelo PDV mas
  inexistentes no banco.
- Ao editar uma migration **já aplicada** (foi o caso da `20260929090000`),
  alinhe o checksum com `node scripts/alinhar-checksum.cjs <nome>`, que
  imprime o SQL de rollback.

## Stack travada
Next.js 16 App Router · Prisma · Supabase (Auth + Postgres) · Zod · Tailwind + shadcn.
**Next 16: usar `src/proxy.ts` (não `middleware.ts` — depreciado).**

## Leis
- Simplicidade primeiro (sem microsserviços/filas/Redis sem necessidade provada).
- `tenantId` em toda query operacional; autorização no servidor (`requirePermission`).
- Valores em centavos; estoque só via movimentação em transação.
- Validar entradas com Zod; nunca expor secrets; nunca confiar no frontend.
- Não misturar escopos: uma tarefa = um módulo. Problema fora do escopo: registrar, não refatorar junto.
- Bug: reproduzir → isolar → teste → corrigir → regressão → documentar.

## Design system
- `src/styles/tokens.css` é o único source of truth de cor. Nenhuma cor
  hardcoded fora dele.
- Regras de peso (`*`, headings) **precisam** estar dentro de `@layer base`.
  Fora de layer, elas vencem as utilitárias do Tailwind na cascata e zeram a
  tipografia da interface inteira. Há teste travando isso:
  `src/styles/tokens.test.ts`.
- Contraste WCAG AA é gate, não sugestão:
  `node scripts/auditar-contraste.mjs` (tem de sair 0 falhas).
  Mudou cor, rode o script.
  **Os quatro gates rodam antes de qualquer commit:**
  ```bash
  npm test                                  # tem de sair tudo verde
  node scripts/auditar-contraste.mjs         # 0 falhas
  node scripts/auditar-cores-hardcoded.mjs  # 0 fora do token
  node scripts/verificar-pesos.mjs          # 0 falhas
  ```
  Contraste e cor/token já estavam quebrados no main em 08/10 e foram
  corrigidos; se voltarem a falhar, é regressão, não baseline.
- **O pre-commit roda `npm run gate`** (instalado por `npm run gate:hook`).
  `.git/hooks/` não é versionado, então é preciso rodar o instalador depois de
  cada `git clone`. Para pular de propósito: `SKIP_GATE=1 git commit …`.
- **Todo script de gate precisa setar `process.exitCode`.** Imprimir o achado e
  sair com 0 faz o gate parecer "ok" para quem o invoca — foi assim que
  `auditar-cores-hardcoded.mjs` enganou todo mundo. Se o gate imprime erro, tem
  que sair com 1.
- **Teste o gate com uma violação de verdade antes de confiar nele.** Gate que
  nunca reprovou não é gate. Para pular: `SKIP_GATE=1`.
- Pesos: 400 (corpo), **500 (rótulo)** e 600 (ênfase). 700 é reservado ao
  valor de KPI e à enfase numérica.
- **Item de menu declara a permissão que a página exige.** `tenantNav` e
  `TENANT_BOTTOM_NAV` trazem `permission`, e o filtro é `visibleTenantNav` /
  `visibleBottomNavItems`. `adminNav` é isento por desenho (`/admin` exige
  `SUPER_ADMIN` inteiro). Menu estático × página que barra = 403 no toque.
- **O FAB da BottomNav é marcado por `fab: true`, nunca por índice.** A lista é
  filtrada por permissão e a posição do PDV muda conforme o role.
- **O `body` não declara `font-size`.** Sem isso, `--text-body` (14px) encolhe
  todo elemento sem utilitária de texto — texto corrido, parágrafos, rótulos de
  tabela — e deixa `text-sm` (14px) do mesmo tamanho que o corpo, apagando a
  distinção. O corpo herda 16px do navegador, que é o que as utilitárias do
  Tailwind assumem.
- **Não replique utilitárias do Tailwind em `@layer components`.** `utilities`
  vem depois de `components` na cascata e sempre vence: a réplica é código morto
  (o `63ab5f2` fez isso e achou que estava funcionando). Consumir os tokens
  `--text-*` exigiria mexer no `@theme` de `globals.css`, não em replicar
  classe aqui.
- Mediu antes de mexer: o sintoma "texto pequeno" pode ser `font-size` no
  corpo, não token de tamanho. `tests/e2e/typography.spec.ts` mede o computado.

## Depois de codar (obrigatório — parte do "done", sem exceção)
Ordem: código → testes → docs → commit. Nenhuma tarefa está concluída sem docs.
Checklist de docs por lote entregue:
1. `docs/changes/YYYY-MM-DD-<tarefa>.md` — o que mudou, por quê, arquivos, testes, riscos.
2. `docs/PROJECT_STATE.md` — data em "Atualizado", fase, recursos, pendings, bugs conhecidos.
3. `docs/ROADMAP.md` — marcar checkboxes concluídos; mover próximos.
4. Decisão estrutural → `docs/decisions/ADR-*.md` (nunca mudar ADR em silêncio).
Proibido commitar lote com docs desatualizados.

## Commits (regra permanente)
- Todo commit é autorado pelo proprietário: **Luiz Marcelo <luizmarcelo31@gmail.com>**.
- Identidade gravada no config LOCAL do repo (`.git/config`); nunca usar outra
  identidade nem alterar o config global.
- Nunca commitar segredos (`.env*`, senhas, chaves).
