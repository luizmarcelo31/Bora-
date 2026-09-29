# 2026-09-29 — Fechamento da Fase 1 do roadmap BoraMais

> Fecha os itens que faltavam em 1.2, 1.3 e 1.4 depois do lote anterior
> (`2026-09-29-fase1-contraste-tipografia.md`). Critério de conclusão da Fase 1:
> "Todos os módulos seguem os tokens e componentes do design system. Nenhuma
> cor hardcoded fora do `tokens.css`."

## 1. `.label-group` finalmente em uso (fecha 1.2)

A classe existia em `tokens.css` desde o lote anterior, testada, com **zero
usos**. O group label da sidebar aplicava estilo ad-hoc:

```
text-xs font-semibold text-sidebar-foreground/70
```

Isso é 11px, sem uppercase e sem o tracking de 0.7px que o roadmap pede.

**Detalhe de cascata que quase repetiu o bug anterior:** `.label-group` está em
`@layer components`, que vem **antes** de `@layer utilities` na ordem de
camadas. Se eu tivesse apenas acrescentado `label-group` na call site, as
utilitárias `text-xs` e `font-semibold` da base do componente venceriam e a
classe não teria efeito nenhum.

Por isso a correção foi feita **na origem** — troquei as três classes
ad-hoc por `label-group` dentro de `SidebarGroupLabel` em
`src/components/ui/sidebar.tsx`. Há um único call site
(`src/components/shell/nav-main.tsx:108`), compartilhado pelas sidebars tenant
e admin, então os dois menus foram cobertos de uma vez.

Verificado no Chromium contra o CSS emitido pelo build:

```
.label-group = weight 600, transform uppercase, size 10px, spacing 0.7px
```

## 2. Sentence case (fecha 1.2)

`scripts/auditar-sentence-case.mjs` varre 231 arquivos e aponta strings de
interface em Title Case. Achou 6; **1 era violação real**:

`src/components/ui/sidebar.tsx` — `aria-label` e `title` do rail de resize
estavam como `"Toggle Sidebar"`: Title Case **e em inglês**, num app pt-BR.
Corrigido para `"Alternar barra lateral"`.

Os outros 5 são Title Case legítimo e foram mantidos:

| Local | String | Por que fica |
|---|---|---|
| `admin/empresas/nova` | `"Conveniência Centro"` | nome próprio de exemplo |
| `dashboard/categorias` | `"Ex.: Bebidas, Aluguel"` | exemplos que o usuário digitaria |
| `dashboard/compras` | `"Ambev S.A."` | razão social |
| `dashboard/sheets-test` | `"T2: AppSheet, FormSheet…"` | nomes de componente em página de teste |

## 3. Cores hardcoded — o gap real da 1.4 (fecha o critério de conclusão)

Não havia hex solto (já auditado no lote anterior), mas em Tailwind o risco
real são as **utilitárias de paleta**, que escrevem cor sem passar por token.
`scripts/auditar-cores-hardcoded.mjs` varre 236 arquivos e achou **6 ocorrências
em um único lugar**: o card de DRE em `dashboard/financeiro/page.tsx`.

```tsx
bg-green-500/10  border-green-500/30  text-green-600
```

O card vizinho (despesas) já usava token (`bg-destructive/10`), então a
inconsistência era visível. Substituído pelos tokens de status, na convenção já
usada no resto do código (`bg-[var(--status-success-bg)]` etc., porque os
tokens de status não estão no `@theme inline`).

**Ganho extra:** `text-green-600` é um valor fixo do Tailwind e ficava
praticamente ilegível no fundo `#0A0A0A` do dark mode. Com token, o verde se
ajusta sozinho. Era um bug de contraste que só aparecia no tema escuro.

Estado final: **0 utilitárias de paleta fora da marca em 236 arquivos.**

## 4. Overlay da sidebar: não era bug, era código morto (1.3)

O `.sidebar-overlay` estava definido em `globals.css` com transição de 180ms
e **nenhum componente o usava**. A auditoria de 1.3 marcou como pendente
"overlay escuro + blur no mobile".

Investigando o componente: a sidebar mobile renderiza `SheetContent`, que é
`DialogPrimitive` do Radix em modo modal. Ele já entrega:

- overlay escuro (`SheetOverlay`, `bg-black/10`)
- blur (`supports-backdrop-filter:backdrop-blur-xs`)
- fechar ao clicar fora (comportamento do Dialog modal)
- animação de entrada/saída via `data-open` / `data-closed`

Ou seja, o item **já estava entregue** por outro caminho. O `.sidebar-overlay`
era código morto que sugeria uma funcionalidade ausente — foi ele que me fez
marcar o item como pendente na auditoria anterior.

Removi a regra e a referência no bloco `prefers-reduced-motion`. Aproveitei
para fazer aquele bloco respeitar a preferência também no overlay e no conteúdo
do Sheet, que antes animavam mesmo com `prefers-reduced-motion: reduce`.

## 5. Gates permanentes

| Script | O que garante |
|---|---|
| `scripts/auditar-contraste.mjs` | WCAG AA nos tokens (0 falhas em 42 pares) |
| `scripts/auditar-cores-hardcoded.mjs` | nenhuma cor de paleta fora do token |
| `scripts/auditar-sentence-case.mjs` | sentence case nas strings de interface |
| `scripts/verificar-pesos.mjs` | pesos e `.label-group` no Chromium |
| `src/styles/tokens.test.ts` | regra de peso não volta para fora de `@layer` |

## Arquivos

- `src/components/ui/sidebar.tsx` — `.label-group` no group label, label pt-BR
- `src/app/dashboard/financeiro/page.tsx` — DRE tokenizado
- `src/app/globals.css` — remoção do overlay morto, reduced-motion do Sheet
- `scripts/auditar-cores-hardcoded.mjs`, `scripts/auditar-sentence-case.mjs` (novos)

## Verificação

| Checagem | Resultado |
|---|---|
| `node scripts/auditar-contraste.mjs` | 0 falhas / 42 pares |
| `node scripts/auditar-cores-hardcoded.mjs` | 0 ocorrências / 236 arquivos |
| `node scripts/auditar-sentence-case.mjs` | 5 legítimos, 0 violações |
| `node scripts/verificar-pesos.mjs` | 0 falhas (Chromium) |
| `node scripts/verificar-checksums.cjs` | 0 divergentes |
| `npm test` | 141 testes / 19 suítes |
| `npx tsc --noEmit` | limpo |
| `npx next build --webpack` | compilou |

## Pendências da Fase 1

- **1.3 parcial por falta de inspeção visual.** Z-index, header de página,
  tabela de produtos, estados dos botões e badges foram verificados só por
  busca de código. Precisam de uma passada no navegador.
- **1.4** o critério de cor está cumprido e auditado por script. A revisão
  módulo a módulo (13 páginas) continua não feita.

Nada aqui é bloqueante para abrir a Fase 2, mas a Fase 1 não deve ser marcada
como concluída sem essa inspeção visual.
