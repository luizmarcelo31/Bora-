# Foco de teclado e alvos de toque: correção medida no navegador

**Data:** 02/10/2026 · **Autor:** Luiz Marcelo <luizmarcelo31@gmail.com>
**Escopo:** design system / acessibilidade (não é feature nem banco)

## Contexto

Auditoria de UI/UX conduzida no navegador com login real (16 rotas do
dashboard, desktop 1249px e mobile 390px). Dois achados:

1. **`:focus-visible` não existia no CSS compilado.** Varrendo
   `document.styleSheets`: `NENHUMA regra focus-visible encontrada`. Tabulando
   pela página, todos os botões mediam `outline=0px none`.
2. **16 controles abaixo de 44px no mobile**, sendo `h-9` (36px) e `h-7` (28px)
   as classes dominantes. "Editar" e "Desativar" na tabela de produtos eram
   81x28.

## Causa raiz

`src/app/globals.css:71-96` tinha `@layer utilities {` **duas vezes** seguidas,
com uma chave `}` sobrando na linha 96. O balanço total fechava (64/64), então
o arquivo compilava — mas a camada interna ficava órfã e o conteúdo dela
`:focus-visible`, `:focus:not(:focus-visible)` e as classes `.stagger-*`
caía fora de qualquer `@layer`.

Fora de layer, essas regras não deveriam vencer nada — mas o build do Tailwind
v4 descarta o bloco. Resultado: a regra não existia no navegador.

**Este é o mesmo padrão do bug já corrigido na Fase 1** (a regra
`* { font-weight: 400 }` fora de `@layer` anulava a tipografia inteira,
`PROJECT_STATE.md` linha 16). Repetiu-se por causa da estrutura de layers, não
por descuido pontual.

## Correção

### 1. Estrutura de layers

`@layer utilities` duplicado removido. `.animate-fade-in-up` e `.stagger-1..5`
agora vivem em um único bloco `@layer utilities` bem formado.

### 2. `:focus-visible` em `@layer base` (não em utilities)

Escolha deliberada sobre a sugestão original de deixá-lo em `utilities`: em
`base` a regra não depende da estrutura de layers acima e sobrevive a
refatorações do arquivo. `base` também é a camada de menor precedência, então
componentes shadcn com `outline-none` continuam governando o particular — a
regra global só entra onde não há conflito.

### 3. Alvos de toque mínimo, só no mobile

```css
@media (max-width: 768px) {
  button, a[href], input:not([type=checkbox]):not([type=radio]), select {
    min-height: 44px;
  }
}
```

Aplica `min-height`, não `height`: aumenta a área clicável sem mexer em
tamanho de fonte nem em layout. A densidade do desktop (h-9/h-7 em tabela) é
intencional e foi preservada — a regra só vale abaixo de 768px.

Checkbox e radio ficaram de fora de propósito: esticar o quadrado quebraria a
proporção.

Primeira versão usava `button:not([data-slot])` para não afetar botões de
ícone. **Isso estava errado** — `data-slot` existe justamente nos botões
menores (`sidebar-trigger` size-7, `ThemeToggle` size-8), então a regra os
poupava e o teste mostrou 2 alvos ainda abaixo de 44px. Simplificado para
`button`.

## Verificação (medida no navegador, não presumida)

| Checagem | Antes | Depois |
|---|---|---|
| Regras `:focus-visible` no CSS compilado | 0 | presentes no CSS emitido |
| Foco computado em `<Button>` | `outline=0px none` | anel shadcn ativo (`oklab(...)` + `borderColor` na cor da marca) |
| Controles < 44px em 390px | 16 | **0** |
| Alturas no desktop | 28/32/36px | 28/32/36px (inalterado) |
| Overflow horizontal 390px | não | não |
| Gates de design system (4) | — | **todos exit 0** |
| `tsc --noEmit` | — | **0 erros** |

Distribuição mobile depois: `{44:5, 48:2, 53:4, 55:1, 84:1}` — nada abaixo
de 44px.

## Correção de um erro meu no meio

Medi `outline=0px none` e concluo que o foco não funcionava. **Estava
errado.** O shadcn `Button` aplica `outline-none` por design e entrega o foco
via `focus-visible:ring-3` (box-shadow). Fora de `@layer base`, o anel do
componente vence a regra global — que é o comportamento correto. O
`outline=0px` que medi era esperado.

O que de fato faltava era a regra global para componentes **sem** anel
próprio. A estrutura de layers continuou errada e foi corrigida, mas a
severidade do achado era menor do que a primeira leitura indicava.

Registrado porque a diferença importa: "foco ausente" e "foco sem fallback
em componente sem anel" são bugs diferentes, com gravidade diferente.

## Pendência que sobrou

**3 `<Select>` (shadcn) continuam sem nome acessível** em `/dashboard/produtos`.
O `Select` não gera `aria-label` sozinho — quem nomeia é o consumidor
(`page.tsx`), e não está nomeando. Leitor de tela anuncia "combobox" sem
dizer o que é.

Não corrigido aqui: cada `Select` precisa de rótulo descritivo
("Filtrar por categoria", "Filtrar por status"), e essa decisão é de
conteúdo, não de CSS. Fica para um lote próprio.

## Arquivos

- `src/app/globals.css` — único arquivo alterado