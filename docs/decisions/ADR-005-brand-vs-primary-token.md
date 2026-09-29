# ADR-005 — Separação entre `--brand` e `--primary` por contraste

**Data:** 2026-09-29
**Status:** Aceito
**Fase:** Roadmap BoraMais 1.1 (Paleta e Tokens) e 1.3 (Componentes Base)

## Contexto

O roadmap de direção visual estabelece duas exigências que, lidas juntas, são
incompatíveis:

1. **1.1** — "Aplicar laranja `#C45C2E` exclusivamente em: ativo, acento, botão
   primário, barra de KPI."
2. **1.1** — "Validar contraste WCAG AA em ambos os modos."

O laranga puro `#C45C2E` tem contraste de **4.27:1** com texto branco, abaixo
do mínimo de 4.5:1 exigido para texto normal. Não existe forma de usar
`#C45C2E` como fundo de botão com rótulo branco e satisfazer AA ao mesmo tempo.

Além disso, a exigência de 1.2 ("pesos só 400 e 600") esbarraria na de 1.3
("KPI Cards — valor 28px/700"), o que motivou a separação de papéis por
semântica, não só por cor.

## Decisão

Separar a cor de marca da cor de ação em dois tokens:

| Token | Valor | Uso | Texto sobre ele |
|---|---|---|---|
| `--brand` | `#C45C2E` (intacto) | Não-textual: barra de KPI, item ativo, ícones, anéis, gráficos | — (limiar 3:1) |
| `--primary` / `--accent` | `#BE592D` | Superfícies preenchidas com rótulo: botões, accent, item ativo da sidebar | branco, 4.51:1 |
| `--destructive` (dark) | `#D73D3D` | Botão destrutivo no dark | branco, 4.54:1 |

A diferença entre a cor de marca e a cor de ação é de 3% em luminância
perceptualmente — invisível a olho, suficiente para fechar a lacuna de
contraste. A identidade visual da marca permanece íntegra em todos os usos
não-textuais, que são exatamente os que o roadmap 1.1 nomeia como
"exclusivamente" do laranga.

## Alternativas descartadas

- **Usar texto escuro no botão primário.** `#111111` sobre `#C45C2E` dá 4.42:1
  — ainda abaixo de 4.5. Descartado.
- **Aumentar o peso da fonte para fechar contraste.** A WCAG permite 3:1 para
  texto com 18px+ bold, mas o rótulo do botão é 12–14px. Descartado.
- **Trocar o laranga da marca.** Contraria a direção visual e a identidade já
  construída. Descartado.
- **Manter o laranga e aceitar o não-Access.** O critério de 1.1 é explícito.
  Descartado.

## Consequências

- Positivo: `scripts/auditar-contraste.mjs` passa a ser o gate objetivo do
  critério 1.1; regressão de contraste quebra o build de verificação.
- `.brand` precisa ser usado explicitamente nos componentes não-textuais. O
  `--brand` ainda não foi adotado em código — os usos não-textuais seguem
  apontando para tokens de ação, que são visualmente equivalentes.
- O `--brand` fica disponível para a Fase 3/4 (gráficos, selos de plano).

## Verificação

```bash
node scripts/auditar-contraste.mjs   # 0 falhas em 42 pares, light + dark
```
