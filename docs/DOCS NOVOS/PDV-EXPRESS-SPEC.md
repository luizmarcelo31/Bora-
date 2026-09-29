# BoraMais — PDV Expresso: redesign "modo balcão"

Base: leitura de `dashboard/pdv/express/express-client.tsx`, `express/page.tsx`, `_components/numeric-keypad.tsx`, `dashboard/layout.tsx`, `BottomNav.tsx`, `AppShell.tsx` e `pdv/actions.ts`. Nada foi executado no navegador: valide no celular real a cada tarefa.

Este arquivo tem prioridade sobre o `MOBILE-UX-SPEC.md` no que diz respeito ao PDV. Ele depende das tarefas T1 a T3 daquele documento (toque global, `AppSheet`, kit de campos).

---

## 1. Diagnóstico (com evidência)

| # | Problema | Onde | Efeito no balcão |
|---|---|---|---|
| 1 | No celular são **dois cartões empilhados** (`grid lg:grid-cols-2`): "Produtos" e depois "Pagamento" | `express-client.tsx` | Para vender é preciso rolar a página: buscar → ticket → teclado → descer → forma de pagamento → recebido → confirmar. É a "tela extensa" |
| 2 | **Quatro camadas fixas** ocupam a tela: cabeçalho do app (48px), título "PDV Expresso" + descrição, barra de baixo (~80px) e uma segunda barra "CONFIRMAR" (`bottom-20`) | `AppShell`, `page.tsx`, `BottomNav`, sticky do Express | Sobra pouca área útil e o botão principal disputa espaço com a navegação |
| 3 | **Rolagem dentro de rolagem**: lista de produtos com `max-h-60` dentro da página que também rola | `express-client.tsx` (`ul.max-h-60`) | Em toque, o dedo "briga" entre as duas rolagens |
| 4 | Catálogo em **lista de texto**, sem foto; "mais vendidos" são só 4 botões pequenos | `topSellerIds` (`take: 4`, de todo o histórico) | Operador lê nome em vez de reconhecer o produto; 4 atalhos é pouco |
| 5 | **Teclado de 12 teclas sempre aberto**, com dois modos (QTD / RECEBIDO) | `NumericKeypad` + `keypadMode` | Ocupa ~250px, e o mesmo teclado muda de função: risco de digitar quantidade no campo errado. Além disso o "Recebido" existe em dois lugares (teclado e campo) |
| 6 | Quantidade só se ajusta **selecionando a linha** e depois usando o teclado | `selectLine` / `onDigit` | Fluxo escondido; para 12 unidades são vários toques |
| 7 | **Cédulas rápidas fixas** (10, 20, 50, 100, 200) mesmo quando menores que o total | `QUICK_BILLS` | Em venda de R$ 42,97 aparecem R$ 10 e R$ 20, inúteis. O certo é sugerir só o que cobre a venda |
| 8 | **Caixa** é um select mostrado em toda venda | `ControlledSelect` "Caixa" | Um passo a mais mesmo quando só há um caixa aberto |
| 9 | Alternância **Único / Dividido** e forma de pagamento sempre expostas | bloco "Pagamento" | Quase toda venda é pagamento único; o caso raro ocupa o lugar do comum |
| 10 | **Desconto** dentro de `<details>` "+ Expandir", com senha digitada no próprio cliente | `details` + `DISCOUNT_PASSWORD` | A senha está escrita no código (`pdv-client.tsx:28`) e é importada pelo Express, então vai no pacote enviado ao navegador |
| 11 | O **troco só aparece num toast** que some | `toast.success("Venda #… Troco …")` | Na hora de devolver dinheiro, o operador precisa ver o valor grande e parado, não numa notificação de 4 segundos |
| 12 | Depois de vender, o **estado limpa mas a página continua rolada** para baixo | `clearSale()` sem rolar/focar | O operador precisa voltar ao topo para a próxima venda |
| 13 | **Venda não é guardada**: tocar em qualquer item da barra de baixo perde o carrinho | estado só em `useState` | Toque acidental = venda perdida |
| 14 | Busca por código não avisa quando **não acha** ou **sem estoque** | `submitSearch()` (só age no caso de sucesso) | O leitor bipa e nada acontece, sem explicação |
| 15 | `getPdvPageData` carrega vendas do dia que o Express **não usa** | `page.tsx` / `actions.ts` | Consulta desperdiçada a cada abertura |

**O que já está bom e deve ser mantido:** split dinheiro+pix, taxa de maquineta, troco calculado, idempotência (`idemRef`), `createSaleAction` retornando `{ ok } | { error }` (perfeito para uma tela de "venda concluída"), botão de Recibo, itens desabilitados sem estoque.

---

## 2. Princípios e metas mensuráveis

O PDV Expresso é uma **máquina de uma tela só**. Ninguém rola a página, nada é decidido antes da hora.

1. **Uma tela, uma rolagem.** A página não rola. A única área que rola é a grade de produtos.
2. **Decisões tardias.** Forma de pagamento, dinheiro recebido, desconto e divisão só aparecem depois de tocar em **COBRAR**.
3. **Zona do polegar.** Tudo que se usa a todo momento fica na metade de baixo: total, COBRAR, último item.
4. **Reconhecer, não ler.** Produto por foto grande e preço, não por linha de texto.
5. **Troco é resultado, não notificação.** Valor gigante, parado, até o operador tocar em NOVA VENDA.
6. **Nunca perder a venda.** Rascunho salvo; desfazer visível; erro não limpa nada.

**Orçamento de toques (meta, verificar no celular):**

| Cenário | Meta |
|---|---|
| Abrir o PDV e adicionar o primeiro item | **0 toques** antes do primeiro item (busca pronta, mais vendidos visíveis) |
| N itens de 1 unidade, pagamento em dinheiro com nota | **N + 3** (COBRAR, nota, RECEBER) |
| N itens, Pix ou cartão (forma lembrada da venda anterior) | **N + 2** (COBRAR, RECEBER) |
| N itens, Pix ou cartão (forma diferente da anterior) | **N + 3** |
| Começar a próxima venda depois de concluir | **1 toque** (NOVA VENDA) |
| Item lido no leitor de código de barras | **0 toques** |

---

## 3. Layout (390×844, celular)

### Estado A — Montando a venda

```
┌──────────────────────────────────┐
│ ✕   Caixa 1        Espera(0)  ⋮  │ 48  barra própria; caixa só se houver >1 aberto
├──────────────────────────────────┤
│ 🔎 Bipe ou busque…       [📷] [⌨]│ 52  campo sempre pronto
├──────────────────────────────────┤
│ [★ Mais vendidos][Cervejas][Refri]→ 44  chips de categoria (rolagem horizontal)
├──────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ foto │ │ foto │ │ foto │       │  grade 3 colunas, cartões ≥ 104px de altura
│ │Coca 2│ │Heine.│ │Água  │       │  nome (2 linhas), preço em destaque,
│ │12,99 │ │ 9,99 │ │ 3,50 │       │  selo de quantidade no carrinho (ex.: ②)
│ └──────┘ └──────┘ └──────┘       │
│ ┌──────┐ ┌──────┐ ┌──────┐       │  ← ÚNICA área que rola
│ │ ...  │ │ ...  │ │ ...  │       │
├──────────────────────────────────┤
│ Coca-Cola 2L        [−] 2 [+]  R$│ 56  último item tocado, com stepper
│ ▲ 3 itens · ver ticket           │ 36
├──────────────────────────────────┤
│ TOTAL                  R$ 42,97  │ 
│ [           COBRAR  →           ]│ 56  botão largo, zona do polegar
└──────────────────────────────────┘   + safe-area
```

Orçamento vertical: 48 + 52 + 44 + 92 (último item + faixa) + ~88 (total + botão) ≈ 324px fixos; o resto (~480px em 844) é grade de produtos.

**Ticket (toque em "ver ticket")** abre `AppSheet` com todas as linhas: foto pequena, nome, stepper, subtotal da linha, remover. Tocar no número da quantidade abre teclado numérico de quantidade (ver 4.3). Rodapé: `Limpar venda` (com `ConfirmSheet`).

### Estado B — Cobrança (`AppSheet`, ~88dvh)

```
┌──────────────────────────────────┐
│ ▬▬▬                              │ alça
│ Total a receber                  │
│ R$ 42,97                         │ 40px, negrito, tabular
│                                  │
│ [ Dinheiro ✓ ] [    Pix     ]    │ 64px cada, forma lembrada vem marcada
│ [  Débito    ] [  Crédito   ]    │
│                                  │
│ ── quando Dinheiro ──            │
│ Recebido                         │
│ [Exato 42,97][R$ 50][R$ 100][R$ 200][Outro]
│ TROCO                            │
│ R$ 7,03                          │ 36px, verde; vermelho "Falta R$ x" se insuficiente
│                                  │
│ ── quando Crédito/Débito ──      │
│ + Taxa da maquineta (2,5%) 1,07  │
│ Cliente paga R$ 44,04            │
│                                  │
│ Desconto        Dividir pagamento│ links secundários (44px de altura)
├──────────────────────────────────┤
│ [       RECEBER R$ 42,97        ]│ rodapé fixo com safe-area
└──────────────────────────────────┘
```

- **Outro** abre o teclado numérico grande **dentro do sheet** (substitui a área de cédulas), no mesmo padrão do `MoneyInput` (digita "5000" → R$ 50,00).
- **Dividir pagamento** troca o corpo por: `Dinheiro [ R$ ___ ]` + `Pix (restante) R$ ___` + chips "Metade", "Tudo dinheiro", "Tudo Pix". Mantém o limite atual (dinheiro + pix).
- **Desconto** abre um segundo `AppSheet`: valor em R$ ou %, depois autorização (ver 4.6).

### Estado C — Venda concluída (tela cheia)

```
┌──────────────────────────────────┐
│               ✓                  │
│        Venda #128 registrada     │
│                                  │
│              TROCO               │
│            R$ 7,03               │ 56px, cor de sucesso, com texto (não só cor)
│   Dinheiro · recebido R$ 50,00   │
│                                  │
│ [         NOVA VENDA            ]│ 64px
│ [ Recibo ]   [ Compartilhar ]    │
└──────────────────────────────────┘
```

Se o troco for zero (Pix, cartão, nota exata), fecha sozinho depois de ~3 segundos, ou no toque. Se houver troco, **só sai ao tocar em NOVA VENDA**.

### Tablet e desktop (≥ `lg`)
Duas colunas: à esquerda busca + categorias + grade; à direita o ticket permanente e o painel de cobrança **inline** (sem sheet). Comportamento e regras iguais; não regredir o que já funciona hoje nessa largura.

---

## 4. Regras de comportamento

### 4.1 Modo imersivo (sem mexer no layout do dashboard)
O Express renderiza um contêiner `fixed inset-0 z-[60]` que cobre cabeçalho e barra de baixo, com a própria barra superior (✕ para sair, caixa, espera, menu ⋮). Assim **não** é preciso reestruturar as rotas nem alterar `dashboard/layout.tsx`, e a barra de baixo continua igual nas outras telas. O ✕ volta para `/dashboard`. Respeitar `env(safe-area-inset-*)` em cima e embaixo. O botão central da barra de baixo continua apontando para `/dashboard/pdv/express`.

### 4.2 Busca e leitor de código de barras
- Campo com `enterKeyHint="search"`, `autoComplete="off"`, `autoCorrect="off"`.
- **Modo leitor (padrão):** `inputMode="none"` para que o teclado do celular não abra a cada bip. Botão ⌨ alterna para `inputMode="search"` quando o operador quer digitar. O foco volta ao campo depois de cada item adicionado.
- **Enter com código exato:** adiciona +1 do produto (mesmo bip repetido = +1 de novo), vibração curta (`navigator.vibrate?.(15)`), linha do último item pisca.
- **Código não cadastrado:** aviso vermelho **persistente** sob o campo ("Código 789… não está cadastrado"), com texto (não só cor), que some no próximo bip ou ao limpar.
- **Sem estoque:** aviso "Sem estoque de {nome}". Não adiciona (o servidor já trava esse caso).
- **Digitação:** filtra a grade em tempo real (`useDeferredValue`), por nome, SKU ou código; até 60 resultados.
- **Câmera (📷):** só exibir quando o navegador suportar leitura de código de barras (`"BarcodeDetector" in window`); caso contrário esconder o botão. Verificar suporte no aparelho real antes de prometer o recurso.

### 4.3 Grade, atalhos e quantidade
- **Toque no cartão = +1.** Selo com a quantidade já no carrinho. Sem estoque = cartão esmaecido com "Sem estoque" em texto.
- **Mais vendidos:** trocar o `take: 4` de todo o histórico por **os 24 mais vendidos dos últimos 30 dias**, exibindo até 18 com estoque. É uma mudança só de leitura, em `express/page.tsx` (não em `services/`); descreva a consulta antes de alterar.
- **Categorias:** incluir `category` em `ExpressProduct` e montar chips a partir dos produtos. "Mais vendidos" é o primeiro chip e o padrão.
- **Quantidade:** stepper `−` `n` `+` no "último item" e no ticket. **Tocar no número** abre um teclado numérico pequeno (sheet baixo) com atalhos **2 · 3 · 6 · 12 · 24** (fardos e caixas) e teclado livre. Acaba o modo "QTD do teclado" e a seleção de linha.
- Remover item: `−` até 0 remove; toast "Coca removida · **Desfazer**".

### 4.4 Caixa
- **Um caixa aberto:** seleciona sozinho e não mostra nada.
- **Vários abertos:** chip na barra superior ("Caixa 1 ▾") que abre sheet de escolha; lembrar a escolha.
- **Nenhum aberto:** faixa amarela fixa "Nenhum caixa aberto · Abrir caixa" (com texto e ícone). Se a regra atual permite vender sem caixa, manter permitido, mas com essa faixa visível. **NÃO CONFIRMADO** se isso deve ser bloqueado: perguntar ao dono antes de mudar a regra.

### 4.5 Pagamento
- Forma padrão = **última usada** (guardar em `localStorage` com try/catch, valor vazio → "Dinheiro"). Nunca gravar nada sensível.
- **Cédulas sugeridas** (substituem `QUICK_BILLS`), calculadas sobre `trocoBase`:
  - total ≤ R$ 200: **Exato** + as 3 menores cédulas de {2, 5, 10, 20, 50, 100, 200} estritamente maiores que o total.
  - total > R$ 200: **Exato** + próximo múltiplo de R$ 50 estritamente maior + próximo múltiplo de R$ 100 estritamente maior (sem repetir).
- Botão principal: `RECEBER R$ {cliente paga}` (já inclui taxa de maquineta). Desabilitado se dinheiro recebido < valor devido, com o motivo escrito ("Faltam R$ 7,03").
- Troco insuficiente aparece como **texto** ("Falta R$ 7,03"), não só vermelho.
- Manter a taxa de maquineta como está (valor calculado no servidor; o cliente só mostra prévia).

### 4.6 Desconto
- Sai do `<details>`. Vira link "Desconto" no sheet de cobrança e abre sheet próprio.
- **Depende da tarefa 0.1 do Roadmap** (senha/PIN validados no servidor). Enquanto ela não existir: mantenha o comportamento atual dentro do sheet, **sem copiar a senha para novos arquivos**, e troque a senha atual, pois ela ficou visível no código.
- Depois da 0.1: `authorizeDiscountAction(pin)` no servidor devolve autorização de curta duração; o cliente nunca conhece a senha.

### 4.7 Não perder a venda
- **Rascunho:** salvar carrinho, forma de pagamento e desconto em `sessionStorage` (try/catch, chave por tenant); restaurar ao reabrir o Express; limpar ao concluir. Aviso discreto "Venda em andamento retomada".
- **Espera (P2):** menu ⋮ → "Colocar em espera" guarda a venda (máx. 3) e abre uma nova; "Retomar (n)" lista as guardadas. Útil quando o cliente esqueceu a carteira.
- **Sair com venda aberta:** ✕ com itens no carrinho abre `ConfirmSheet` "Sair e manter a venda em espera?" / "Descartar" / "Continuar".
- **Erro do servidor:** nada é limpo. Mensagem em texto no sheet; botão RECEBER volta a funcionar; a chave de idempotência já existente continua sendo reutilizada apenas até o sucesso.

### 4.8 Acessibilidade e conforto
- Cada cartão é `<button>` com nome acessível "{nome}, {preço}, {n} no carrinho".
- Região `aria-live="polite"` anuncia "Coca-Cola 2L adicionada, 2 no carrinho".
- Alvos ≥ 48px nos tiles e ≥ 56px em COBRAR/RECEBER/NOVA VENDA.
- Contraste do botão principal: ver 3.8 do `MOBILE-UX-SPEC.md` (laranja `#C45C2E` com texto branco = 4,27:1).
- `prefers-reduced-motion`: sem animação de pulso; manter apenas mudança de cor.
- Bloquear zoom por toque duplo nos botões (`touch-action: manipulation`) para não dar zoom acidental no balcão.

---

## 5. Estrutura de código sugerida

```
dashboard/pdv/express/
  page.tsx                    (mantém; muda só a consulta dos mais vendidos e o mapeamento de category)
  express-client.tsx          (vira só a composição das peças abaixo)
  _lib/use-express-sale.ts    (estado, derivados e ações; nenhum JSX)
  _components/
    express-shell.tsx         (contêiner imersivo + barra superior)
    scan-bar.tsx              (busca / leitor / avisos)
    product-tiles.tsx         (chips de categoria + grade)
    last-item-strip.tsx       (último item + stepper + faixa "ver ticket")
    ticket-sheet.tsx
    quantity-sheet.tsx
    checkout-sheet.tsx        (formas, dinheiro, troco, taxa)
    split-panel.tsx
    discount-sheet.tsx
    sale-done-screen.tsx
lib/pdv-math.ts               (funções puras, com testes)
```

`lib/pdv-math.ts` (funções puras, sem React): `calcTotals({ subtotal, discount, method, feeCredit, feeDebit })`, `calcChange({ received, due })`, `calcSplit({ total, cash })`, `suggestBills(total)`. Toda a matemática do dinheiro passa por aqui, e a tela só exibe.

**Casos de teste obrigatórios** (valores em centavos; `feeCredit = 2.5`):

| Caso | Entrada | Esperado |
|---|---|---|
| Dinheiro com troco | total 4297, recebido 5000 | troco 703 |
| Dinheiro exato | total 4297, recebido 4297 | troco 0 |
| Dinheiro insuficiente | total 4297, recebido 4000 | falta 297, não permite receber |
| Crédito com taxa | total 4297, crédito | taxa 107, cliente paga 4404 |
| Débito sem taxa configurada | total 4297, `feeDebit = 0` | taxa 0, cliente paga 4297 |
| Split | total 4297, dinheiro 2000 | pix 2297; recebido 5000 → troco 3000 |
| Desconto | subtotal 5000, desconto 500 | total 4500; desconto maior que subtotal → total 0 |
| Cédulas (pequeno) | total 4297 | Exato 4297, 5000, 10000, 20000 |
| Cédulas (nota exata) | total 5000 | Exato 5000, 10000, 20000 |
| Cédulas (grande) | total 32000 | Exato 32000, 35000, 40000 |

Se o arredondamento do servidor for diferente do usado hoje no cliente (`Math.round`), o servidor manda: confira em `services/` e alinhe o teste ao resultado do servidor. **NÃO CONFIRMADO** se o servidor recalcula a taxa dividida; verifique antes de mexer no split.

---

## 6. Tarefas (uma por sessão, nesta ordem)

Antes de tudo: T1 a T3 do `MOBILE-UX-SPEC.md` (toque global, `AppSheet`, kit de campos). Se o `package.json` não estiver disponível ao agente, ele deve começar conferindo as versões de `vaul`, Tailwind e Next.

**E0 — Extrair a matemática para `lib/pdv-math.ts` (sem mudar a tela).**
Mover os cálculos de total, taxa, troco e split de `express-client.tsx` para funções puras e cobrir com os casos da seção 5. A tela passa a chamar as funções.
*Pronto quando:* testes passam; a tela atual funciona igual (mesmos valores para as mesmas vendas); nenhum JSX alterado além das chamadas.

**E1 — Hook `useExpressSale` e contêiner imersivo.**
Mover estado e ações para `_lib/use-express-sale.ts`. Criar `express-shell.tsx` (fixo, cobre cabeçalho e barra de baixo, ✕ para sair). Layout ainda pode ser o antigo dentro dele.
*Pronto quando:* a página não rola no celular; a barra de baixo do app não aparece no Express e volta nas outras telas; `createSaleAction` chamada com os mesmos campos de hoje.

**E2 — Busca/leitor, categorias e grade.**
`scan-bar`, `product-tiles`, consulta dos mais vendidos (24, últimos 30 dias), `category` no produto do cliente.
*Pronto quando:* bipar 10 códigos seguidos adiciona 10 itens sem tocar na tela e sem abrir o teclado; código inexistente mostra aviso persistente; a grade tem uma única rolagem.

**E3 — Dock, último item e ticket.**
`last-item-strip`, `ticket-sheet`, `quantity-sheet` (com 2·3·6·12·24), desfazer de remoção.
*Pronto quando:* alterar a quantidade de qualquer item não exige selecionar linha nem usar o modo QTD; remover mostra "Desfazer".

**E4 — Cobrança.**
`checkout-sheet` (formas, cédulas sugeridas, troco, taxa), `split-panel`, `discount-sheet` (com o aviso da 4.6). Usa `AppSheet`, `MoneyInput` e `ChipSelect`.
*Pronto quando:* os cenários "N + 3" e "N + 2" da seção 2 são atingidos no celular; o botão RECEBER mostra o motivo quando desabilitado; nenhum `<details>` sobra no Express.

**E5 — Venda concluída.**
`sale-done-screen`, NOVA VENDA, Recibo, fechamento automático quando o troco é zero.
*Pronto quando:* com troco, a tela só fecha ao tocar; a próxima venda começa com busca pronta e a grade no topo.

**E6 — Rascunho, espera e saída segura.**
Persistência em `sessionStorage`, "Espera", `ConfirmSheet` ao sair com venda aberta.
*Pronto quando:* recarregar a página no meio de uma venda restaura o carrinho; tocar sem querer em outra aba da barra de baixo não é mais possível (imersivo) e o ✕ protege a venda.

**E7 — Câmera e feedback (opcional).**
Botão 📷 apenas onde há `BarcodeDetector`; vibração e som opcional (configuração do operador).
*Pronto quando:* testado em pelo menos um Android real; em iPhone o botão simplesmente não aparece se não houver suporte.

Não fazer antes da E5: animações decorativas, tema novo, ícones novos.

---

## 7. Não mexer

- Contrato de `createSaleAction` (`FormData` com `items`, `paymentMethod`, `payments`, `cashBoxId`, `discount`, `received`, `customerName`, `idempotencyKey`; retorno `{ ok } | { error }`).
- Regras de venda no servidor: preço do banco, atacado automático, travas de estoque/desconto/caixa, idempotência, taxa.
- `services/`, `schema.prisma`, rotas existentes, autenticação.
- O PDV tradicional (`/dashboard/pdv`) fica como está nesta fase.

## 8. Validação no celular (em toda tarefa)

- 360, 390 e 430px, com e sem barra de gestos. Rodar um app de leitor de código de barras em modo teclado (ou um leitor Bluetooth) para testar o fluxo do bip.
- Conte os toques dos cenários da seção 2 e anote o número real.
- Teclado aberto no campo de busca: dock e COBRAR continuam visíveis.
- Rotacionar o aparelho: nada quebra.
- Erro de rede: nada é perdido; mensagem em português.
- Dark mode e contraste do botão principal.
- Diga explicitamente o que **não** foi testado.

## 9. Prompt de abertura

> Leia `PDV-EXPRESS-SPEC.md` e `mobile-saas-skill.md` inteiros. Execute **somente** a tarefa E__ da seção 6. Antes de escrever código, liste os arquivos que vai ler e os que vai alterar. Não toque em `services/`, `schema.prisma`, no contrato de `createSaleAction` nem nas regras de venda. Não instale dependências. No fim, rode tsc, lint e testes, liste os arquivos alterados e diga o que não conseguiu testar.
