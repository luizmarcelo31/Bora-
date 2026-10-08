# Menu por permissão

**Data:** 07/10/2026 · **Autor:** Luiz Marcelo

## Sintoma

No celular, o menu rápido (BottomNav) oferecia cinco destinos e três deles
levavam a `/unauthorized` ao toque — inclusive o FAB (o "+", que é o PDV
rápido). Na sidebar do desktop eram 5 itens em 403 de 15. O relatório era "as
funções do navbar deram unauthorized".

**Não era feature flag.** Nenhuma existe no projeto. `disabled` existe no tipo
de nav e é usado em um único item do admin (`/admin/faturamento`), sem relação
com permissão.

## Causa

Duas, independentes.

### 1. Menu estático × página que barra

`src/app/dashboard/layout.tsx` montava a BottomNav com cinco destinos literais.
Cada página chama `requirePermission` e responde `redirect("/unauthorized")`
quando o role não tem a permissão. A lista nunca conversou com a matriz.

Para `FUNCIONARIO` (só `products.view`, `inventory.view`, `sales.view`):

| item | permissão da página | resultado |
|---|---|---|
| Início | — | ok |
| Estoque | `inventory.view` | ok |
| **PDV (FAB)** | `sales.create` | **403** |
| **Caixa** | `cashbox.view` | **403** |
| **Finan.** | `financial.view` | **403** |

No mobile isso é pior que no desktop: a BottomNav é a **única** navegação, e o
FAB é o item de maior destaque da tela.

Oito itens da sidebar não têm guarda nenhuma (`/dashboard`, produtos,
categorias, inventário, promoções, compras, auditoria, novidades) — o lado
oposto da mesma inconsistência: `FUNCIONARIO` entra em "Auditoria" sem
bloqueio.

### 2. O FAB era posicionado por índice

`BottomNav.tsx` usava `i === 2` e `grid-cols-5` fixos. Qualquer filtro por
permissão quebraria os dois: a marca cairia sobre "Estoque" para quem não pode
vender, e sobraria coluna vazia.

## Correção

Backend intacto: `requirePermission` continua sendo a autoridade em todas as
páginas. O que mudou foi o menu parar de oferecer beco sem saída.

- `src/navigation/tenant-bottom-nav.ts` (novo) — a BottomNav como dado, cada
  item declarando a mesma permissão que a página exige. `fab: true` marca o
  PDV em vez de índice, então o filtro não desloca a logo.
- `src/navigation/tenant-nav.ts` — cada item ganhou `permission`, e
  `visibleTenantNav()` filtra. Grupo sem item utilizável some inteiro, para não
  deixar "OPERAÇÃO" colado sobre lista vazia.
- `BottomNav.tsx` — grade dinâmica em vez de `grid-cols-5`; `return null` com
  lista vazia.
- `src/lib/permissions.ts` — `can()` aceita `null`/`undefined`, nega na dúvida.
  Já fazia isso por dentro; agora sem cast no call site.

`adminNav` **não** ganhou filtro: `/admin` exige `SUPER_ADMIN` por inteiro, e
filtrar lá seria código morto. O comentário do arquivo já dizia isso.

### Armadilha: `tenant-sidebar.tsx` precisa de `"use client"`

Tirei a diretiva na primeira passada e a página inteira caiu. `nav` carrega
ícones do lucide, que são `forwardRef` — objeto com método, não serializável.
Sem a fronteira o React recusa com erro #441. É o mesmo bug que o `e3f054c`
corrigiu no BottomNav. O `role` chega do layout como string de enum (serializa)
e o filtro roda no client — não é brecha, porque a autorização continua na
página, no servidor.

## Reversão visual — NÃO ENTROU NESTE COMMIT

O dono pediu voltar a interface ao padrão visual anterior. **Cheguei a
implementar e medir em navegador, mas o lote não entra aqui**, por dois motivos
concretos:

1. **`origin/main` estava 19 commits à frente** e não continha o trabalho. É a
   armadilha que o próprio `AI_RULES.md` (seção "Banco, schema e migrations")
   descreve: clone atrasado descreve um banco e um código que já mudaram. As
   feature flags que o dono suspeitava (`src/lib/feature-flags.ts`, tabela
   `FeatureFlag`, `/admin/features`) existem **nesse** histórico, não no local.
   Quando fiz `git fetch`, o merge descartou a reversão tipográfica inteira
   porque os 19 commits reescreveram os mesmos arquivos.

2. **A reversão conflita com trabalho deliberado e recente.** Os commits
   upstream incluem `feat(ui): refinamentos visuais PDV e Usuários`,
   `feat(admin): otimização visual completa`, `feat(mobile): padroniza listas`,
   `fix(a11y): restaura foco de teclado e alvos de toque`, mais
   `src/styles/mobile-tokens.css` e `src/components/mobile/` (kit novo). Não é
   reversão de um acidente: é um redesign com 19 commits, testes e screenshots
   deEvidence atrás.

Reverter por cima disso seria jogar fora trabalho recente sem saber qual parte
o dono quer de volta. **Precisa de decisão explícita dele**, não de dedução
minha.

### O que a reversão tinha foundado (medido, não teórico)

Para quando for decidida, o diagnóstico já está pronto:

**A causa do "ar de reduzido" não era só peso.** Os tokens `--text-*` do
`tokens.css` encolhiam a escala inteira — `text-xs` 12→11px, `text-sm`
14→12px. Nenhuma mudança de peso explicaria isso, e foi o achado mais
importante. Ao lado disso:

- Normalização 400/600 → medium/bold, revertida **hunk a hunk** (60 arquivos,
  78 linhas). `font-semibold` tem dois antecessores possíveis — o 500 dos
  rótulos e o 700 dos números viraram o mesmo 600 — e nenhum regex no arquivo
  sabe qual era qual. Só o diff sabe.
- `PageHeader` (faixa laranja → transparente com borda inferior),
  `SidebarGroupLabel` (uppercase 10px/0.7px → `text-xs font-medium`), item
  ativo e badge da sidebar (600 → 500), `FilterTabs` (pill laranja →
  `TabsList` padrão).

### O que NÃO pode ser revertido

- `* { font-weight: 400 }` dentro de `@layer base`. Fora de layer vence as
  utilitárias e a UI inteira cai para 400 — é o bug que a `da1e409` consertou.
- Tokenização de cor e ADR-005 de contraste (4 pares abaixo de 4.5:1).
- `--text-micro`, consumido pelo group label.

### Bug novo encontrado no caminho

O `tokens.test.ts` (que trava a cascata) **já falha no HEAD** de
`origin/main`: a regra `não deixa seletor de font-weight solto no arquivo`
quebra porque o `tokens.css` upstream ganhou um bloco de utilitárias
replicadas em `@layer components`. Verificado com stash — falha igual sem
nenhuma alteração minha. Não corrigi aqui por ser escopo alheio, mas
**está quebrado no main**.

### Duas armadilhas da execução

**`h1` em 500.** O revert automático acertou o `font-bold` certo, mas na
reescrita do `PageHeader` eu acertei o peso errado — o original era 700 com
`text-2xl`/`md:text-3xl`. Pego pelo teste, que mede `getComputedStyle`.

**`tokens.test.ts` quebrado por comentário novo.** O teste faz
`indexOf(".label-group")` e pegou um comentário meu, fora de layer. O texto
foi reescrito.


## Testes

- `src/navigation/tenant-nav.test.ts` (novo, 15 testes) — inclui a invariante
  central: **nenhum role recebe item cuja permissão não tem**, e nenhum role
  fica sem navegação.
- `tests/e2e/menu-permission.spec.ts` (novo) — clica em todo item das **duas**
  listas e falha se algum cair em `/unauthorized`. Rodado nos dois roles.

Prova no navegador, viewport 390px, conta real no banco:

| role | sidebar | bottom nav | 403 |
|---|---|---|---|
| PROPRIETARIO | 16/16 | 5/5 | 0 |
| FUNCIONARIO | 11/11 | 2/2 | 0 |

Antes da correção, como FUNCIONARIO, eram 5 destinos no mobile com **3 em 403**
(inclusive o FAB).

`tests/e2e/typography.spec.ts` **não entra neste commit** — mede a reversão
tipográfica, que ficou de fora. Fica no repo para quando ela for decidida.

## Verificação

- `tsc` limpo; **299 testes / 31 suítes** (+15). A única falha é o
  `tokens.test.ts` **que já quebrava no HEAD** de `origin/main` (verificado
  com stash, sem alteração minha).
- Lint: 135 problemas / 61 erros. **Maioria pré-existente** dos 19 commits
  upstream (`scripts/`, `docs/`), não introduzida aqui — o clone local estava
  19 commits atrás, e por isso o baseline anterior media 25/13.
