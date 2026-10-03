# Listas e cor semântica — o que mudou

**Data:** 03/10/2026 · Escopo: camada visual e de navegação. Nenhuma regra de
negócio, API, banco ou permissão foi tocada.

## O problema

Dez rotas repetiam a mesma `<ul>` mobile com `<li className="flex items-center
gap-3 rounded-lg border p-3">`, e cada cópia tinha derivado um pouco: umas com
`gap-2`, umas com `p-2`, umas com `text-xs`, umas sem alvo de 44px. Duas telas
fazendo a mesma coisa de jeito diferente é exatamente o que faz o operador
perder confiança na tela.

E o sinal financeiro não existia. Saldo negativo, despesa e entrada de estoque
apareciam todos em cinza — o dono da conveniência lia o número, não o sinal, e
o saldo negativo passava batido.

## Componentes criados

### `src/components/shared/Valor.tsx`

`<Valor tom="neutro|positivo|negativo|atencao">` e `<ValorNum valor formatar />`.

Reusa os tokens de status de `src/styles/tokens.css` — nenhum hex. O tom vem
do mesmo dialeto dos `StatusBadge`, para a interface não ter duas maneiras de
dizer "positivo".

`ValorNum` decide o tom pelo próprio número: acima de zero positivo, abaixo
negativo, zero neutro.

### `src/components/shared/LinhaLista.tsx`

A linha de lista mobile, em duas formas:

```
┌──────────────────────────────────────────┐
│ [avatar] Título principal        R$ 0,00 │
│          apoio 1 · apoio 2               │
│          [badge] [badges]                │
├──────────────────────────────────────────┤
│                     [ações]              │  ← quando há 2+ botões
└──────────────────────────────────────────┘
```

Três decisões que vieram de medir, não de supor:

**As ações vão para baixo.** A 390px, com "Dar baixa · Editar · Excluir" na
mesma linha do título, o título do lançamento colapsava para `V..` e a data com
a categoria sumiam. Três botões com texto ocupam ~170px de 390px. O dado é o que
o usuário veio ler; a ação é o que ele faz depois. Com um único ícone, as duas
linhas são desperdício — daí `acoesNaLinha`.

**Os selos têm slot próprio (`badges`).** Na mesma linha do `apoio`, dois badges
começavam a truncar a data: `28/09/2026 · Vendas PDV` virava `Ve...`.

**`avatar` é opcional.** `AvatarProduto` mostra a foto do Storage quando existe
e cai para a inicial quando não — a grade do PDV reconhece por foto, o catálogo
precisa do nome.

## Rotas tratadas

16 telas. Em todas, a tabela desktop (`hidden md:block`) ficou intacta — a
variação é só na versão mobile.

**Tenant:** dashboard, estoque, financeiro, produtos, caixa, categorias,
inventário, compras, promoções, relatórios, auditoria, divergências,
low-stock-table.

**Admin:** empresas, assinaturas, planos, suporte.

`/dashboard/divergencias` ganhou a variante mobile que não existia.

## Cor semântica aplicada

| Dado | Tom | Onde |
|---|---|---|
| Saldo do mês | positivo / negativo por sinal | dashboard, financeiro, relatórios, caixa |
| Receita / despesa | positivo / negativo | financeiro, DRE |
| Compra total | negativo, ou atenção se pendente | compras |
| Saldo de caixa | por sinal | caixa |
| Entrada / saída de estoque | positivo com `+` / negativo / atenção | estoque |
| Saldo de produto | negativo zerado, atenção baixo, neutro ok | estoque, produtos, low-stock |
| MRR | positivo | admin |
| Assinatura cancelada / pagamento pendente / suspensa | negativo / atenção / atenção | admin/assinaturas |
| SLA vencido | atenção | admin/suporte |
| Empresa suspensa/cancelada | negativo | admin/empresas |

## Duas correções que a verificação visual encontrou

**Despesa com sinal invertido no mobile.** A primeira versão mostrava
`-R$ 1.500,00` no mobile e `R$ 1.500,00` no desktop. Dois lugares fazendo a
mesma coisa de jeito diferente é o que faz o operador errar o troco. Agora o
número é o mesmo nas duas telas e o sinal vem do badge e da cor.

**`MetricCard` com `value: string`.** Alargado para `React.ReactNode` para
aceitar `<Valor>`. Mudança puramente aditiva — nenhum chamador existente mudou.

## Verificação

```
npx tsc --noEmit                          → limpo
node scripts/auditar-cores-hardcoded.mjs   → 0 falhas (284 arquivos)
node scripts/auditar-contraste.mjs         → 0 falhas
node scripts/auditar-sentence-case.mjs     → 4 avisos, todos pré-existentes
```

Prova em navegador a 390px, dia e escuro, com login real:
`docs/mobile/screens/listas/390-lista/` e `.../390-dark/`.

Contraste do dark mode conferido pelos tokens: fundo `#0A0A0A`, foreground
`#FFFFFF`, muted `#A0A0A0`, success `#6EE7B7`, destructive `#D73D3D`.

## Pendência

O aviso vermelho "1 Issue" que aparece sobre a BottomNav nas capturas não é do
app — é overlay da ferramenta de auditoria do Hermes. Não há código
correspondente no repositório.
