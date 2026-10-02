# Backlog de produto: o que o dono da conveniência pede

**Data:** 02/10/2026 · **Autor:** Luiz Marcelo <luizmarcelo31@gmail.com>
**Escopo:** produto / UX (não é implementação — nenhum código mudou neste lote)
**Origem:** análise do fluxo real de uso, escrita na perspectiva do dono de uma
conveniência pequena, não da de um revisor de design.

Este documento **não é uma lista de tarefas**. Cada item explica o momento do
dia a dia em que aparece, o que o usuário perde, e o porquê de cada escolha.
Sem esse contexto, qualquer decisão futura vai otimizar a tela em vez de
resolver o problema.

## O dia de quem usa

Para calibrar o julgamento de todos os itens abaixo:

- Abre a loja às 6h, fila até as 9h
- O sistema é usado por ele e por um funcionário **novo, que não sabe usar
  computador**
- Se o app o faz **parar e pensar**, ele desliga
- Perde dinheiro quando a tela confunde, não quando o sistema cai

Duas frases definem o critério de aceitação de qualquer item:

> Não pode fazer o usuário parar para pensar.
> Não pode existir duas telas fazendo a mesma coisa de jeito diferente.

---

# 🔴 Prioridade 1 — segurança e confiança

## 1.1 Tirar a senha do desconto da tela e do cliente

**Arquivo:** `src/app/dashboard/pdv/pdv-client.tsx:30` e `:309`

Hoje existe ``export const DISCOUNT_PASSWORD = "..."`` **hardcoded no cliente**,
e a tela exibe literalmente **"PIN: 1234 (demo)"** sob o diálogo de troca de
operador.

Não é detalhe visual. É a senha do desconto dentro do bundle que baixa para o
navegador de qualquer máquina da loja. Qualquer funcionário descobre lendo o
código ou a tela; qualquer pessoa com acesso ao celular do balcão lê a dica.
O efeito é desconto não autorizado — e, pior, **um funcionário que sabe disso
para de confiar no sistema e começa a anotar as vendas em papel**.

**O que fazer**
- Validar a senha no servidor; nunca enviar o valor esperado ao cliente
- Remover a dica `PIN: 1234 (demo)` da tela
- Se o dono esquecer a senha, oferecer redefinição — não dica

**Por que o usuário pede:** ele precisa poder confiar que o número de desconto
não é furada. E precisa poder mostrar a tela pro cliente sem vergonha.

## 1.2 O indicador de venda offline precisa gritar

**Arquivos:** `src/lib/offline/*`, `src/components/offline/SyncIndicator.tsx`

O modo offline com fila é **o melhor recurso que o produto tem** — a venda
fica garantida no aparelho e sobe sozinha depois. Só que hoje isso aparece num
indicador discreto.

Cenário real: vendi offline, não vi o indicador, cliente pagou, e eu lancei a
venda de novo. Duplicou o faturamento e perdi a confiança no sistema.

**O que fazer**
- Na hora da venda offline, uma confirmação explícita: **"Venda salva neste
  aparelho. Vai subir sozinha."**
- Indicador persistente enquanto houver fila, com quantidade e tempo
- Warning se o tempo de fila passar do aceitável

**Por que o usuário pede:** ele precisa saber que pode vender sem rede.
O sistema já garante — ele só não **diz**.

---

# 🟠 Prioridade 2 — não errar dinheiro

## 2.1 Total consistente em todas as telas

**Arquivos:** `src/app/dashboard/pdv/pdv-client.tsx:371,452` ·
`src/app/dashboard/pdv/express/express-client.tsx:285-286`

Este é o **item com melhor relação custo/benefício de toda a lista**, e o
primeiro que eu atacaria.

Hoje o mesmo número recebe pesos diferentes em telas diferentes:

| Tela | Subtotal | Total |
|---|---|---|
| PDV clássico | `text-base font-semibold` | `text-lg` |
| PDV express | `text-xs text-muted-foreground` | `text-lg` |

Na correria eu leio o número grande e pronto. Se ele é subtotal numa tela e
total noutra, **eu erro o troco e perdo dinheiro real**.

**O que fazer**
- Um único componente de total, mesmo tamanho, mesma posição, nas duas telas
- Desconto aplicado tem que fazer o número **cair visivelmente**, não mudar de
  lugar
- Mesmo componente no PDV clássico, no express e no resumo de fechamento de caixa

**Por que o usuário pede:** ele quer **confiar** na tela. Uma tela que muda de
regra entre si mesma obriga ele a conferir, e conferir em cada venda é o
exato custo que ele está tentando eliminar.

## 2.2 Produto precisa ser identificável em meio segundo

**Arquivos:** `src/app/dashboard/pdv/_components/product-grid.tsx` ·
favoritos em `pdv-client.tsx:331`

Vou comprar Coca, Coca Zero e Coca Diet. Se a grade mostra "Coca" duas vezes
com preço diferente, **eu paro e pergunto ao cliente** — e perco a venda.

**O que fazer**
- Foto do produto no botão (1 imagem resolve mais que qualquer filtro)
- Nome completo visível, sem truncamento
- Preço grande e com `tabular-nums`
- Produto **sem estoque não aparece** na grade — não fica cinza. Ver um item e
  ele não estar disponível me faz perder a venda e a confiança

## 2.3 Código de barras no PDV clássico

**Arquivos:** `src/app/dashboard/pdv/pdv-client.tsx:73,84` ·
`src/app/dashboard/pdv/express/express-client.tsx:142`

O express busca por `barcode`. O clássico **não tem leitor** — e o `barcode`
nem entra no snapshot offline (`barcode: null` na linha 84).

Conveniência vive de código de barras. O cliente chega, "é esse aqui", e eu
não posso digitar 13 dígitos com ele na frente.

**O que fazer:** leitor no clássico, igual ao express; e incluir `barcode` no
catálogo offline.

---

# 🟡 Prioridade 3 — o dia corrido

## 3.1 Troca de operador em um toque

**Arquivos:** `src/app/dashboard/pdv/pdv-client.tsx` (diálogo de PIN) ·
`pdv/express/express-client.tsx:289-295`

Existe diálogo de PIN para troca de operador — bom. Mas está escondido.

Cenário real: atendendo eu, entra a funcionária nova. Ela precisa operar com a
identidade dela, senão a auditoria aponta a venda para mim e o
comissionamento dela fica errado.

**O que fazer:** botão fixo no topo do PDV, sempre visível, sem menu. Trocar
operador acontece 5 vezes por dia e tem que levar 2 segundos.

## 3.2 Mensagens que dizem o que fazer

**Arquivo:** `src/app/dashboard/pdv/pdv-client.tsx:31-38` (`SALE_ERROR_MSG`)

O mapa de erro já existe — isso está bem feito. O problema é o texto: "não
encontrado" não me diz se **eu digitei errado**, se **o produto não existe** ou
se **o servidor caiu**.

**O que fazer**, reescrevendo no formato "o que aconteceu + o que fazer":

| Hoje | Pedido |
|---|---|
| "Produto não encontrado" | "Produto não encontrado. Escaneie de novo ou chame o gerente." |
| "Sem conexão" | "Sem conexão. A venda foi salva aqui e vai subir sozinha." |
| "Venda inválida. Confira os itens." | "Confira os itens do carrinho antes de finalizar." |

O usuário **não** quer saber o nome do erro. Quer saber o que ele faz agora.

## 3.3 Sem opção de "não sei o que vender" nas bandeiras

**Arquivo:** `src/app/dashboard/pdv/pdv-client.tsx` (busca) — placeholder atual

Hoje a busca exige nome ou categoria. Cliente pede "uma coisa gelada", não "o
refrigerante de uva da marca X de 2 litros".

**O que fazer:** placeholder que **ensina o atalho** — "Buscar ou bipar
(código de barras)". A busca é a ação mais frequente do PDV; ela não pode
parecer campo de formulário.

---

# 🔵 Prioridade 4 — dinheiro que o dono não percebe

Hoje o dashboard mostra faturamento, 3 produtos ativos e 2 caixas abertos. Eu
**não olho isso na correria**, e o que me custa dinheiro nunca aparece.

O que eu quero é o sistema me **avisar** do que mudou, não eu ir procurar:

| O que me custa dinheiro | O que eu quero ver |
|---|---|
| Produto que quase esgotou | maior venda do dia, na tela do PDV |
| Produto que parou de vender | 30 dias sem vender = estoque preso |
| Erro de troco | fechamento de caixa com diferença sinalizada |
| Venda grande fora do horário | alerta de venda até o limite configurado |
| Desconto overuse | quem aplicou, quanto, quando |

**Princípio:** o dashboard responde "como foi ontem?" — mas quem me faz
perder dinheiro **não aparece no dashboard**. Precisa de notificação.

---

# ⛔ O que NÃO mudar

Vale mais registrar o que não deve ser tocado, porque é onde a tentação de
"deixar mais bonito" estraga um produto que funciona:

- **Não aumentar o espaçamento do desktop.** A densidade do PDV funciona. É o
  que me deixa ver 30 produtos sem rolar. As correções de alvo de toque
  (2026-10-02) já são mobile-only por isso.
- **Não trocar a fonte.** Inter não é a fonte mais bonita do mundo, mas é
  legível em tela pequena e sob luz de fluorescente — que é o meu ambiente.
- **Não adicionar ilustração, sombra, animação.** Eu quero a informação mais
  rápido possível.
- **Não aumentar o número de telas.** Cada tela nova é mais um lugar onde
  procurar informação. O problema é que a informação está espalhada, não
  faltando.

---

# Ordem sugerida

| # | Item | Esforço | Retorno |
|---|---|---|---|
| 1 | **2.1 Total consistente** | baixo | **alto** |
| 2 | **1.1 Senha do desconto** | médio | **alto** (segurança) |
| 3 | **1.2 Gridar o offline** | baixo | alto |
| 4 | **3.2 Mensagens de erro** | baixo | alto |
| 5 | 2.2 Foto + estoque | médio | alto |
| 6 | 3.1 Troca de operador | baixo | médio |
| 7 | 2.3 Código de barras | médio | médio |
| 8 | 3.3 Atalhos na busca | baixo | médio |
| 9 | Prioridade 4 (avisos) | alto | alto |

**Se for atacar um só nesta semana: 2.1 (total consistente).** Mexe no usuário
todo dia, custa pouco, e é a diferença entre eu conferir a tela e confiar nela.

# Como este documento deve ser usado

Ao implementar qualquer item acima, a pergunta a responder não é "ficou bonito?"
mas **"isso reduz o tempo entre o cliente pedir e eu cobrar?"** Se não reduz,
o item não estava alinhado com a lista.

Ao fechar cada item, atualizar `docs/PROJECT_STATE.md` e remover a linha da
tabela aqui, como manda `docs/AI_RULES.md`.

## Verificação de origem

Todos os itens foram derivados de leitura do código do PDV
(`pdv-client.tsx`, `express-client.tsx`, `product-grid.tsx`, `cart-sheet.tsx`,
`scan-bar.tsx`) e da auditoria visual em navegador de 02/10/2026
(16 rotas, desktop e mobile). Nenhuma sugestão aqui é genérica de "boas
práticas de dashboard": cada uma cita arquivo e linha.

Nenhuma alteração de código foi feita neste lote.