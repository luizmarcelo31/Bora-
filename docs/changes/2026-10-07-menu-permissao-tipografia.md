# Menu por permissão + reversão da escala de texto

**Data:** 07/10–08/10/2026 · **Autor:** Luiz Marcelo

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
## Reversão da escala de texto (08/10)

O dono pediu voltar ao padrão visual anterior e, após ver o conflito com os 19
commits de redesign, definiu o escopo: **só a escala de texto**.

### O que era, na verdade

O primeiro diagnóstico (07/10) apontou os tokens `--text-*` encolhendo a
escala. **Medindo no navegador contra o `origin/main` atual, isso não se
confirmou** — as utilitárias do Tailwind computavam no tamanho padrão (xs 12px,
sm 14px, base 16px). O `origin/main` havia ganhado um bloco que replica
`.text-xs` e afins em `@layer components`; como `utilities` vem **depois** de
`components` na ordem de camadas, essa réplica **nunca vencia**. Era código
morto.

A encolhimento real tinha outra origem, e era uma linha só:

```css
/* src/styles/tokens.css, @layer base — adicionado pelo 63ab5f2 */
body { font-size: var(--text-body); }   /* --text-body: 14px */
```

`--text-body` é 14px. Antes do `63ab5f2` o `body` **não declarava tamanho** e
herdava 16px do navegador. Como a maioria dos elementos da interface não tem
utilitária de texto explícita, aquele `font-size` encolheu texto corrido,
parágrafos, rótulos de tabela e texto de célula — tudo que depende do
herdado.

E havia um efeito pior que o tamanho: `text-sm` é 14px no Tailwind, exatamente
o mesmo valor do corpo. Com o corpo em 14px, **`text-sm` e o texto corrido
ficavam do mesmo tamanho** e a distinção sumia.

### O que foi feito

1. **`font-size` removido do `body`.** Volta a herdar 16px. Medido: `body` e
   `<p>` sem utilitária qualquer went de 14px → 16px.
2. **Réplica de utilitárias removida** de `@layer components` (`.text-xs`,
   `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`,
   `.text-3xl`, `.font-normal`, `.font-medium`, `.font-semibold`,
   `.font-bold`). Código morto, e era o que quebrava o `tokens.test.ts`.
3. **Quatro custom properties de peso removidas** (`--font-weight-normal`,
   `-medium`, `-semibold`, `-bold`): sem consumidor depois do item 2. Peso é
   lido direto da classe; um token de peso sem consumidor é só uma segunda
   fonte que pode divergir da primeira.

Os tokens `--text-xs` a `--text-3xl` **permanecem declarados** no `:root` como
referência da hierarquia do design system. Consumi-los exigiria mexer no
`@theme` de `globals.css` — que é outra decisão, não esta.

### Medido depois

```
body:              16px   (era 14px)
p sem utilitaria:  16px   (era 14px)
text-xs            12px
text-sm            14px   <-- voltou a ser MAIOR que o corpo
text-base          16px
text-lg            18px
text-xl            20px
text-2xl           24px
text-3xl           30px
```

Idêntico em 1440px e 390px. `mobile-title` e `mobile-body` também subiram de
14 para 16px — não declaram tamanho e herdavam do `body`.

### Bug do main que isso fechou

O `tokens.test.ts`, que trava a cascata, **estava falhando no `origin/main`**
(verificado com stash, sem alteração local). A regra "não deixa seletor de
peso solto no arquivo" acusava justamente a réplica de `.font-*` em
`@layer components`. Com a réplica removida, passa: **5/5**.

### O que NÃO foi tocado

- `* { font-weight: 400 }` dentro de `@layer base`. Fora de layer vence as
  utilitárias e a UI inteira cai para 400 — é o bug que a `da1e409` consertou.
- Tokenização de cor e ADR-005 de contraste.
- `--text-micro`, consumido pelo group label.
- Pesos (`font-medium`/`font-semibold`): o padrão 400/600 da Fase 1 segue
  valendo. **Não foi revertido** — o dono definiu o escopo como escala de
  texto.
- `PageHeader`, `SidebarGroupLabel`, `FilterTabs`: o chrome da Fase 1 segue
  como está, pelo mesmo motivo.
- `src/styles/mobile-tokens.css` e `src/components/mobile/`: o kit mobile
  fica inteiro.

### Duas armadilhas

**O teste de cascata é frágil por construção.** Ele faz `indexOf("font-weight")`
cru e não distingue comentário de seletor. Achei isso duas vezes: primeiro ao
comentar `--font-weight-normal`, depois ao escrever a explicação da remoção.
A solução foi escrever a documentação sem repetir a string literal — e não
afrouxar o teste, que é a trava que impede a repetição do bug da cascata.

**Medir antes de mexer.** Se eu tivesse aplicado a reversão de 07/10 às cegas
sobre o `origin/main`, teria reescrito 60 arquivos e "consertado" uma escala
que já estava correta — gastando o esforço em Typography e o que importa de
verdade era uma linha.

## Testes

## Fecha de dois gates quebrados no main (08/10)

Lever os quatro gates a zero revelou que dois já estavam vermelhos no
`origin/main`, sem relação com o escopo deste lote:

**Contraste WCAG AA.** Botão destrutivo no dark: `#EF4444` sob texto branco,
3.76:1 (mínimo 4.5:1). O light já usava `#DC2626` e passava com 4.83:1 — a
divergência é o dark estar **mais claro** que o light, o oposto do que a
hierarquia de superfície pede. Escureci o dark para `#D73D3D` (4.54:1).
Corrige sem tocar no light, que já estava certo.

**Cor fora do token.** `pdv-client.tsx:378` usava `text-neutral-500` +
`dark:text-neutral-400` no texto de apoio do desconto. Trocado por
`text-muted-foreground`, que é o token de texto secundário e se ajusta ao modo
sozinho.

Depois: `auditar-contraste.mjs` **0 falhas**, `auditar-cores-hardcoded.mjs` **0
em 295 arquivos**.

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

`tests/e2e/typography.spec.ts` (novo, 08/10) — mede a escala computada no
Chromium: corpo, `<p>` sem utilitária, e as sete utilitárias de tamanho do
Tailwind. Inclui a asserção de que `text-sm` é **maior** que o corpo, que é a
distinção que o `63ab5f2` apagou.

## Verificação

- `tsc` limpo; **300 testes / 31 suítes**, **todas verdes** — incluindo o
  `tokens.test.ts`, que quebrava no `origin/main`.
- **Os quatro gates de design system em zero:** contraste 0 falhas, 0 cor fora
  do token (295 arquivos), pesos 0 falhas, sentence case com 5 apontamentos
  pré-existentes que são placeholders legítimos ("Ex.: Bebidas, Aluguel",
  "Ambev S.A.") — falsos positivos do gate, não interface.
- `menu-permission.spec.ts` e `typography.spec.ts` verdes com conta real.
- `prisma migrate status`: 14 migrations, schema up to date.
- Lint: sem regressão introduzida aqui.
