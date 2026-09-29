# 2026-09-29 — Fase 1: contraste WCAG e pesos tipográficos

> Lote focado em fechar o critério de conclusão da Fase 1 do `docs/boramais-roadmap.md`:
> "Todos os módulos seguem os tokens e componentes do design system. Nenhuma cor
> hardcoded fora do `tokens.css`."

## Contexto

O `docs/boramais-roadmap.md` tinha **todos** os checkboxes vazios, apesar do
histórico git mostrar Fases 1 e 2 entregues. Antes de executar o roadmap
restante foi feita uma auditoria do código real contra o documento. Ela
encontrou a Fase 1.1 quase toda entregue (4 cores hardcoded no projeto inteiro,
todas de ThemeProvider/manifest) e a Fase 1.2 quebrada.

## 1. Contraste WCAG AA (critério 1.1 — nunca verificado)

Novo `scripts/auditar-contraste.mjs` lê `src/styles/tokens.css` e mede 21 pares
de cor em light e dark. Resultado inicial: **4 falhas**.

| Par | Antes | Razão | Correção |
|---|---|---|---|
| Botão primário (light) | 4.27 | `#FFFFFF` sobre `#C45C2E` | `--primary` → `#BE592D` (4.51) |
| Accent (light e dark) | 4.27 | idem | `--accent` → `#BE592D` (4.51) |
| Botão destrutivo (dark) | 3.76 | `#FFFFFF` sobre `#EF4444` | `--destructive` → `#D73D3D` (4.54) |

O roadmap exige duas coisas incompatíveis: o laranga `#C45C2E` **e** WCAG AA.
O laranga puro dá 4.27 com texto branco. A saída foi separar os papéis:

- novo token `--brand: #C45C2E` — a cor de marca intacta, só para uso
  **não-textual** (barra de KPI, item ativo, ícones, anéis, gráficos). Esses
  passam do limiar de 3:1 para UI/texto grande.
- `--primary` / `--accent` / `--sidebar-primary` / `--sidebar-accent` continuam
  sendo a cor de ação, escurecida o mínimo (`#BE592D`, 3% mais escuro) para
  fechar 4.5:1 com texto branco.

Decisão registrada em `docs/decisions/ADR-005-brand-vs-primary-token.md`.
Estado final: **0 falhas em 42 verificações**, nos dois modos.

## 2. Pesos tipográficos (critério 1.2 — bug de cascata)

O roadmap 1.2 pede "pesos só 400 e 600" e o 1.3 pede KPI em **700**. O
`tokens.css` atendia a isso com uma regra global solta no arquivo:

```css
*, *::before, *::after { font-weight: 400; }
```

O Tailwind v4 emite as utilitárias (`.font-bold`, `.font-medium`) dentro de
`@layer utilities`, e **na cascata CSS o que está fora de layer vence o que
está em layer**. Esse `*` sem layer anulava todas elas.

Medido em Chromium (`scripts/medir-pesos-camada.mjs`), com o CSS real emitido
pelo `next build`:

| Elemento | Antes | Depois |
|---|---|---|
| `.font-bold` (KPI 700) | **400** | 700 |
| `.font-medium` (500) | **400** | 500 |
| `.font-semibold` (600) | 600 | 600 |
| sem classe (400) | 400 | 400 |

Ou seja: **o KPI em 700 previsto no 1.3 nunca apareceu na tela.** O
`.font-semibold` sobrevivia porque o bloco original o nomeava explicitamente.

Correção: a regra foi movida para `@layer base` e o `.label-group` para
`@layer components`, ficando assim sobrescrevíveis por utilitárias.

> Nota de método: a primeira tentativa de provar isso usou JSDOM, que **não
> implementa cascade layers** e devolvia resultados falsos. A prova só became
> válida no Chromium.

## 3. Normalização dos pesos

O roadmap 1.2 só admite 400 e 600 (700 reservado ao KPI, por 1.3). Com o bug
corrigido, os 500 ficaram visíveis pela primeira vez. Foram normalizados
**39 usos de `font-medium` → `font-semibold` em 32 arquivos**. Os `font-bold`
foram mantidos onde são enfase numérica (preço, quantidade, valor de KPI),
conforme o 1.3.

> Risco registrado: a primeira execução da troca em PowerShell leu os arquivos como
> ANSI e regravou em UTF-8, corrompendo acentuação (`começar` → `comeÃ§ar`).
> Detectado no diff e revertido; refeito em Node. Diff final conferido: só a
> troca de peso.

## 4. Guardas permanentes

- `src/styles/tokens.test.ts` — 5 testes travam a regra de layer (regressão do
  bug da cascata).
- `scripts/auditar-contraste.mjs` — contraste WCAG dos tokens.
- `scripts/medir-pesos-camada.mjs` — prova da cascata em Chromium.
- `scripts/verificar-pesos.mjs` — pesos computados no CSS realmente emitido.

## Arquivos

- `src/styles/tokens.css` (contraste + layers)
- `src/styles/tokens.test.ts` (novo)
- 32 arquivos `.tsx` sob `src/` (peso 500 → 600)
- `scripts/auditar-contraste.mjs`, `scripts/medir-pesos-camada.mjs`,
  `scripts/verificar-pesos.mjs`, `scripts/calibrar-cores.mjs` (novos)

## Verificação

| Checagem | Resultado |
|---|---|
| `node scripts/auditar-contraste.mjs` | 0 falhas / 42 verificações |
| `node scripts/verificar-pesos.mjs` | 0 falhas (Chromium) |
| `node scripts/medir-pesos-camada.mjs` | bug confirmado + corrigido |
| `npm test` | 141 testes / 19 suítes |
| `npx tsc --noEmit` | limpo |
| `npx next build --webpack` | compilou |

## Pendente (Fase 1.2)

- `.label-group` está implementada e testada, mas **ainda não é usada em
  nenhuma tela** — os group labels do menu ainda não foram migrados.

## Bugs conhecidos

- Nenhum aberto por este lote.
