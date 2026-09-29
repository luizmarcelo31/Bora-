# BoraMais — Spec de UX Mobile (modais, cadastro e CRUD)

Escrito a partir da leitura do código do zip `boramais-conveniencia`. Nada aqui foi rodado no navegador: os problemas abaixo vêm do código, com arquivo citado. Valide no celular real a cada tarefa.

**Atenção:** o `package.json` não veio no zip. As versões de `vaul`, Tailwind e Next **não foram verificadas**; os trechos de código deste documento são ponto de partida e o agente deve conferir as versões antes de usá-los (T1 e T2 começam por isso).

**PDV Expresso:** o redesign completo está em `PDV-EXPRESS-SPEC.md` e tem prioridade sobre qualquer trecho deste arquivo que fale de PDV.

Este documento **complementa** o `mobile-saas-skill.md` que você já tem (mesmas regras de preservar lógica, backend e contratos). Ele acrescenta o que faltava: um desenho concreto de sheets, formulários e CRUD.

---

## 0. Regras para o agente (cole no início de cada sessão)

- Uma tarefa por sessão (seção 6). Leia os arquivos citados antes de mexer.
- Não altere `services/`, `schema.prisma`, regras de venda nem rotas existentes. Exceção: tarefas marcadas **[BACKEND-LITE]**, e só depois de explicar a mudança.
- Não instale biblioteca nova. Já existem `vaul`, `radix-ui`, `sonner`, `lucide-react`, shadcn.
- Use só tokens do projeto (`--primary`, `--status-*`, etc.). Não invente cor. Paleta: day = fundo branco + laranja `#C45C2E`; dark = fundo preto + branco no lugar do laranja.
- Todo texto de interface em português, sem termo técnico ("Storage não configurado", "role", "SKU único por empresa" viram frases para o dono da loja).
- Ao terminar: rode `tsc`, lint e testes; liste arquivos alterados; diga o que **não** foi testado.

---

## 1. Diagnóstico (com evidência)

| # | Problema | Onde | Por que incomoda no celular |
|---|---|---|---|
| 1 | `Dialog` é um cartão centralizado `max-w-sm` | `components/ui/dialog.tsx`; usado em `caixa/close-dialog`, `estoque/edit-inventory-dialog`, `categorias/category-dialogs`, `pdv/cancel-dialog` | Fica no meio da tela, o teclado sobe por cima, polegar não alcança o botão. Parece site, não app |
| 2 | `Sheet` de baixo sem alça, sem arrastar para fechar, sem rodapé fixo | `components/ui/sheet.tsx`; usado em `produtos/edit-dialog`, `financeiro/financial-dialogs` | O botão **Salvar fica no fim do scroll**. Formulário longo = rolar para achar o Salvar. Sem `safe-area` no rodapé |
| 3 | Cadastro embutido em `<details>` na própria página | `produtos`, `promocoes`, `categorias`, `caixa`, `compras` (2x), `inventario`, `financeiro` | Formulário "+ Expandir" empurra a lista para baixo e usa grid de 3 colunas (`sm:grid-cols-3`). Não é fluxo de cadastro, é formulário de admin |
| 4 | Botões pequenos demais | `Button size="sm"` = `h-7` (28px), 48 usos no dashboard; `hit-area-44` só em 23 | Alvo abaixo de 44px, fácil errar o toque, sobretudo ao lado de "Desativar" |
| 5 | Ações empilhadas em cada linha (Editar + Desativar) | `produtos/page.tsx` lista mobile | Ocupa altura, sem hierarquia, ação destrutiva colada na principal |
| 6 | Três `MetricCard` grandes no topo | `produtos/page.tsx` (`sm:grid-cols-3`, `MetricCard`) | No celular são 3 cards empilhados: uma tela inteira antes da lista. A própria skill (§7) pede faixa compacta |
| 7 | Filtro e busca só por "Filtrar" (submit) | `produtos/page.tsx` | Sem busca instantânea. Carrega o catálogo inteiro e filtra na página; sem paginação nem ordenação |
| 8 | Foto do produto só existe na edição, com `input file` cru e 3 formulários separados dentro do sheet | `produtos/edit-dialog.tsx` | Sem prévia, sem câmera direta, não aparece no cadastro. Enviar foto e salvar dados são ações separadas |
| 9 | CRUD incompleto | `actions.ts` de cada módulo | Produto: sem excluir/duplicar. Promoção: sem editar. Fornecedor: só criar. Compra: **só valor total, sem itens** (`PurchaseItem` existe no schema mas o formulário não usa) |
| 10 | Erros e sucesso via `?error=` na URL (`SearchParamToast`) | `produtos/page.tsx` e demais | A página recarrega, o formulário perde o que foi digitado, o erro não aponta o campo |
| 11 | Nenhum `enterKeyHint`/`autoComplete`; `type="number"` para estoque | grep em `dashboard/` | Teclado errado ou sem botão "Próximo/Ok". Campo de estoque com setinhas de spinner |
| 12 | Contraste do botão principal | `#C45C2E` com texto branco = **4,27:1** | Abaixo de 4,5:1 (WCAG AA) para texto pequeno. Ver 3.8 |

O que **já está bom** e deve ser mantido: `CartSheet` do PDV já usa `vaul` com `safe-area`; `BottomNav` respeita safe-area e alvos de 44px; existe lista compacta no mobile em `produtos`; `useIsMobile` já decide sheet inferior x painel lateral.

---

## 2. Padrões de referência (Drogasil, Zé Delivery, iFood)

Não copie layout, marca nem ícones deles. O que vale aproveitar são padrões que os apps de varejo e delivery repetem porque funcionam no polegar:

- **Sheet inferior com alça** que fecha arrastando; ação principal **fixa no rodapé**, larga, sempre visível.
- **Stepper de quantidade grande** (− 1 +), nunca campo numérico solto.
- **Chips horizontais de filtro** com contagem, em vez de dropdown.
- **Barra flutuante de resumo** ("Ver carrinho · 3 itens · R$ 42,97") sempre acessível.
- **Linha de lista com foto grande à esquerda**, nome, preço em destaque e um único ⋯ para o resto.
- **Busca fixa no topo**, instantânea, com sugestão de recentes.
- **Skeleton** ao carregar, **estado vazio com botão de ação**, **confirmação de sucesso** clara com "Desfazer" quando reversível.
- **Status como chip com ícone + texto** (nunca só cor).

Diferença importante: eles são apps de **cliente comprando**. O BoraMais é ferramenta de **operador trabalhando**, muitas vezes com uma mão ocupada. Adapte: menos decoração, mais velocidade e menos toques.

---

## 3. Fundação: componentes-base (fazer antes de qualquer tela)

### 3.1 Alvo de toque global (uma mudança, 48 lugares)
Em `components/ui/button.tsx`, para telas de toque, elevar os tamanhos pequenos sem mudar o desktop:

```
xs / sm / icon-xs / icon-sm  →  acrescentar  pointer-coarse:min-h-11 pointer-coarse:min-w-11
```

`default` fica `h-9`, mas com `pointer-coarse:h-11`. Depois disso, `hit-area-44` manual deixa de ser necessário nos botões. (Confira se a versão do Tailwind suporta `pointer-coarse:`; se não, use `@media (pointer: coarse)` em uma classe utilitária.)

### 3.2 `AppSheet` — primitivo único (substitui Dialog e Sheet de formulário)
Arquivo novo: `components/ui/app-sheet.tsx`, sobre `vaul` (já usado no `CartSheet`). Comportamento:

- **Mobile:** sobe de baixo, alça visível, arrasta para fechar, `max-h-[92dvh]`, cantos superiores `rounded-t-2xl`. **Desktop:** painel lateral direito (`sm:max-w-lg`).
- **Três zonas:** cabeçalho fixo (título, descrição curta, fechar) · corpo com scroll · **rodapé fixo** com `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`.
- O arraste só começa pela alça (`handleOnly`, se a versão do vaul suportar) para não brigar com o scroll do formulário.
- Foco vai para o primeiro campo ao abrir e volta ao botão que abriu ao fechar.
- `prefers-reduced-motion`: sem animação de slide.

Esqueleto:

```tsx
"use client";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function AppSheet({ open, onOpenChange, title, description, children, footer, dismissible = true }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  title: string; description?: string;
  children: React.ReactNode; footer?: React.ReactNode; dismissible?: boolean;
}) {
  const isMobile = useIsMobile();
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"} dismissible={dismissible} handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className={cn(
          "fixed z-50 flex flex-col bg-background outline-none",
          isMobile ? "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl" : "inset-y-0 right-0 w-full sm:max-w-lg border-l"
        )}>
          {isMobile && <Drawer.Handle className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />}
          <header className="px-4 pb-2 pt-3">
            <Drawer.Title className="font-heading text-base font-semibold">{title}</Drawer.Title>
            {description && <Drawer.Description className="text-sm text-muted-foreground">{description}</Drawer.Description>}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer && <footer className="border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</footer>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

(É um ponto de partida. O agente deve validar as props contra a versão instalada do `vaul` e testar com teclado aberto.)

### 3.3 `FormSheet` — formulário dentro do AppSheet
Recebe `title`, `submitLabel`, `pending`, `dirty`, `onSubmit`. Regras:

- Botão principal **no rodapé fixo**, largura total, `h-12`, texto do que ele faz ("Salvar produto", "Lançar despesa"), nunca só "Salvar".
- Botão secundário "Cancelar" abaixo/ao lado; no mobile o fechar é a alça.
- **Guarda de alterações:** se o usuário digitou algo e tenta fechar (arrastar, tocar fora, Voltar), abrir `ConfirmSheet` "Descartar alterações?". Sem alterações, fecha direto.
- O botão fica desabilitado enquanto `pending` e mostra "Salvando…". Nunca perder o que foi digitado em caso de erro.
- Como o `<form>` fica no corpo e o botão no rodapé, use `<button type="submit" form="id-do-form">`.

### 3.4 `ConfirmSheet` — substitui `AlertDialog` e `cancel-dialog`
Sheet curto de baixo: título, consequência em uma frase ("Isso devolve 3 itens ao estoque"), botão destrutivo à esquerda-abaixo e "Cancelar" como ação padrão. Para ações graves (cancelar venda, excluir), motivo em **chips** (não texto livre) quando o sistema já exige motivo.

### 3.5 Kit de campos (`components/forms/`)
- `Field` — rótulo sempre visível, marcador de obrigatório, dica curta, **mensagem de erro ligada ao campo** (`aria-describedby`, `aria-invalid`).
- `MoneyInput` — teclado numérico, máscara em reais enquanto digita, guarda centavos internamente. `inputMode="decimal"`, `enterKeyHint="next"`. Substitui os `Input inputMode="decimal"` soltos e o `parseBRL` duplicado em `close-dialog` e `cart-sheet`.
- `QuantityStepper` — − / valor / +, botões 44px, pressionar e segurar acelera. Substitui `type="number"` de estoque.
- `BarcodeField` — campo de código de barras com `inputMode="numeric"`; botão de câmera **opcional** quando o navegador suportar leitura (`BarcodeDetector`); caso contrário só digitação/leitor USB.
- `ChipSelect` — escolha única em chips (tipo do lançamento, motivo, forma de pagamento). Use quando há até ~6 opções; acima disso, `SelectField` que abre em sheet.
- `DateField` — data com atalhos "Hoje", "Ontem"; mantém `type="date"` nativo por baixo.
- Todo input com `autoComplete="off"` quando não for dado pessoal, `enterKeyHint` coerente (`next`/`done`/`search`).

### 3.6 `RowActions` (menu ⋯)
Um botão ⋯ de 44px por linha que abre sheet de ações: **Editar, Duplicar, Ativar/Desativar, Excluir** (destrutiva, separada e em vermelho com ícone). Substitui a pilha "Editar + Desativar".

### 3.7 Lista e filtros
- `SearchField` — sempre visível no topo, busca com *debounce* de ~250ms atualizando a URL (`router.replace`), botão de limpar, `enterKeyHint="search"`.
- `FilterChips` — chips roláveis na horizontal com contagem ("Todos 84 · Ativos 80 · Estoque baixo 6").
- `SortSheet` — ordenar por nome, preço, estoque, mais vendidos.
- `MetricStrip` — substitui o trio de `MetricCard` no mobile: uma faixa de 3 números lado a lado, ~64px de altura total. Mantenha o `MetricCard` no desktop.
- Paginação no servidor (30 por página) com "Carregar mais"; `loading.tsx` com skeleton de linhas.

### 3.8 Contraste do laranja
`#C45C2E` com texto branco dá 4,27:1. Para botões e texto pequeno, use um token separado (`--primary-strong`) por volta de `#B34F26` (≈5,2:1) **ou** aumente o texto do botão para 16px semibold. Mantenha `#C45C2E` para ícones, bordas e fundos grandes. No dark mode, o primário branco sobre preto já passa; confira apenas os estados de foco e desabilitado.

---

## 4. Padrão de CRUD (vale para todos os módulos)

### 4.1 Lista
```
Produtos                     [ + Novo ]
84 produtos
[ 🔎 Buscar nome, SKU ou código   ]
[Todos 84][Ativos 80][Estoque baixo 6][Sem foto 12]
Total 84 · Ativos 80 · ⚠ Baixo 6
────────────────────────────────────
[foto] Coca-Cola 2L               ⋯
       R$ 12,99   ● 24 un.  Bebidas
```
Cada linha: foto 48px, nome (1 linha), preço em destaque, chip de estoque, categoria em texto secundário, ⋯ à direita. Toque na linha abre o **detalhe** (4.2). Altura ~72px.

### 4.2 Detalhe do registro
Rota dedicada (`/dashboard/produtos/[id]`) ou sheet em tela cheia. Cabeçalho com foto, nome, preço e status. Abas: **Resumo · Estoque · Preço · Histórico** (histórico = movimentos de estoque e vendas recentes que já existem no banco). Ações no rodapé: Editar (principal), ⋯ para o resto.

### 4.3 Criar / editar (FormSheet em tela cheia no mobile)
Seções com abertura progressiva; **o essencial aparece aberto, o resto recolhido**:

1. **Essencial (aberto):** foto (câmera/galeria, com prévia) · nome · preço de venda · categoria (chips ou sheet) · código de barras (`BarcodeField`).
2. **Custo e margem (aberto):** custo · **margem calculada ao vivo** ("Margem 48%") · preço de atacado e quantidade mínima quando houver.
3. **Estoque (recolhido):** estoque inicial (só no cadastro) · mínimo · máximo (`QuantityStepper`).
4. **Mais informações (recolhido):** SKU · descrição.

Rodapé fixo: **[ Cadastrar produto ]** e, no cadastro, um link secundário **"Salvar e cadastrar outro"** (fluxo de quem cadastra 30 itens seguidos). A foto é enviada junto com o salvar; não deve existir mais botão "Enviar foto" separado.

### 4.4 Feedback
- Sucesso: `toast` curto embaixo, acima da BottomNav, com **Desfazer** quando a ação é reversível (desativar, mover estoque).
- Erro: no campo que falhou + resumo no topo do sheet. **O formulário nunca fecha nem limpa em erro.**
- Trocar a mensagem técnica `Storage não configurado. Veja docs/STORAGE.md.` por "Não foi possível enviar a foto agora. O produto foi salvo sem foto." (o detalhe técnico vai para o log).
- **[BACKEND-LITE]** Para erros por campo é preciso que as actions devolvam `{ ok, fieldErrors }` em vez de redirecionar com `?error=`. Faça isso criando versões compatíveis com `useActionState` que **reusam os mesmos validadores e services**, mantendo as actions antigas até a migração terminar. Explique a mudança antes de fazer.

### 4.5 Estados obrigatórios
Vazio (com botão de ação), carregando (skeleton), erro de rede (com "Tentar de novo"), sem resultado de busca (com "Limpar filtros"), offline (aviso discreto, sem travar a leitura).

---

## 5. Aplicação por módulo

| Módulo | O que mudar | Lacuna de CRUD |
|---|---|---|
| **Produtos** | 4.1 a 4.4 completos; foto no cadastro; margem ao vivo; `MetricStrip` | Falta **duplicar** e **excluir/arquivar**: excluir só se não houver venda, senão arquivar **[BACKEND-LITE]** |
| **Estoque** | Ajuste rápido: sheet "Entrada · Saída · Ajuste" com `QuantityStepper` e motivo em chips; `Limites` vira FormSheet com stepper; histórico de movimentos por produto | Ajuste e limites já existem; falta histórico visível |
| **Categorias** | FormSheet de uma linha (nome) + `ConfirmSheet` para excluir mostrando quantos produtos usam | Já tem CRUD completo; só refazer a camada visual |
| **Financeiro** | Lançamento em FormSheet: **Receita / Despesa / Transferência** em chips coloridos com ícone; valor grande com `MoneyInput`; data com Hoje/Ontem; categoria em chips; "Pago" como switch | Editar/excluir existem; adicionar filtros por período em chips |
| **Caixa** | Abrir caixa: sheet com valor inicial em teclado numérico grande. Fechar: valor contado + **diferença ao vivo em bloco com ícone e texto** ("Falta R$ 5,00"), não só cor | Falta sangria/suprimento (Roadmap 1.3); o layout já deve prever a ação |
| **Compras** | Nova compra em fluxo: fornecedor → **itens** (buscar/bipar produto, quantidade, custo unitário) → total calculado → salvar. Receber compra: `ConfirmSheet` "Entram 24 unidades no estoque" | Hoje só existe valor total sem itens **[BACKEND-LITE]**; depende da tarefa 0.2 do roadmap (compra movimenta estoque). Fornecedor sem editar |
| **Promoções** | FormSheet com tipo em chips (Percentual · Valor fixo · Combo), produtos com seleção múltipla pesquisável, vigência com atalhos | **Falta editar** e **excluir**. Antes de polir a tela, fazer a Fase 1.2 do roadmap (a promoção ainda não é aplicada no PDV) |
| **Inventário** | Modo de contagem em tela cheia: bipa ou busca, `QuantityStepper`, progresso "12 de 48", salvar rascunho, revisar divergências antes de finalizar | Já existe contagem cega; falta a experiência de contagem |
| **PDV Expresso** | Redesign completo: ver `PDV-EXPRESS-SPEC.md` (tarefas E0 a E7) | Não mexer na regra de venda |
| **PDV tradicional (carrinho)** | Manter `vaul`. Adicionar stepper por linha, remover item, desconto e forma de pagamento em chips dentro do sheet, barra flutuante "Ver carrinho · N itens · R$" | Não mexer na regra de venda |
| **Cancelar venda** | `cancel-dialog` vira `ConfirmSheet` com motivo em chips | Sem mudança de regra |
| **Configurações** | Seções recolhíveis; `QuantityStepper`/`MoneyInput` no lugar de `type="number"` | — |

---

## 6. Tarefas para o OpenCode (uma por sessão)

**Ordem revisada:** T1 → T2 → T3 → **E0 a E5 do `PDV-EXPRESS-SPEC.md`** → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11. O PDV Expresso vem antes do piloto de produto porque é a tela mais usada e a que mais incomoda; `AppSheet` e o kit de campos (T2, T3) são pré-requisito dele.

Cada tarefa termina quando o "Pronto quando" é verdadeiro e `tsc`, lint e testes passam.

**T1 — Alvo de toque global (3.1).**
Pronto quando: em tela de toque, todo `Button` tem ao menos 44px; nada quebra no desktop.

**T2 — `AppSheet`, `FormSheet`, `ConfirmSheet` (3.2 a 3.4).**
Pronto quando: existe uma página de teste (removível) que abre os três; o rodapé fica fixo com o teclado aberto; arrastar pela alça fecha; foco volta ao gatilho; guarda de "descartar alterações" funciona.

**T3 — Kit de campos (3.5).**
Pronto quando: `Field`, `MoneyInput`, `QuantityStepper`, `ChipSelect`, `DateField` existem com testes de unidade para a máscara de dinheiro (entrada "1299" → R$ 12,99 → 1299 centavos).

**T4 — Piloto: editar produto (substituir `produtos/edit-dialog.tsx`).**
Pronto quando: o formulário usa FormSheet com as seções de 4.3, o botão Salvar está no rodapé fixo, a foto sobe junto com o salvar, o comportamento de salvar é idêntico ao anterior (`updateProductAction` continua a mesma). **Pare aqui e me mostre.** Não migre outros módulos antes da aprovação.

**T5 — Lista de produtos (4.1 + 3.6 + 3.7).**
Pronto quando: `MetricStrip`, busca instantânea, chips de filtro, ⋯ por linha, skeleton, paginação de 30. Tabela do desktop continua igual.

**T6 — Cadastro de produto em sheet (substituir o `<details>` de `produtos/page.tsx`).**
Pronto quando: botão "+ Novo" abre o mesmo FormSheet em modo criar, com "Salvar e cadastrar outro".

**T7 — Migrar os demais `Dialog` para `AppSheet`/`ConfirmSheet`.**
Alvos: `caixa/close-dialog`, `estoque/edit-inventory-dialog`, `categorias/category-dialogs`, `pdv/cancel-dialog`, `financeiro/financial-dialogs`.
Pronto quando: nenhum `DialogContent` centralizado é usado em telas do tenant no mobile.

**T8 — Trocar os 8 `<details>` de cadastro por FormSheet** (`produtos` já é a T6; aqui: `promocoes`, `categorias`, `caixa`, `compras` x2, `inventario`, `financeiro`). O `<details>` de desconto do Express fica com a tarefa E4 do `PDV-EXPRESS-SPEC.md`.
Pronto quando: nenhuma página empurra a lista com formulário expandido.

**T9 — Detalhe do produto (4.2)** e histórico de movimentos.
Pronto quando: tocar na linha abre o detalhe com as abas; ações no rodapé.

**T10 — [BACKEND-LITE] Erros por campo e ações de CRUD que faltam.**
Passo 1: proponha por escrito a mudança mínima (versões `useActionState` das actions, ação de duplicar produto, arquivar produto sem vendas, editar promoção). Passo 2: só implemente depois de eu aprovar.
Pronto quando: erro de validação aponta o campo e não recarrega a página.

**T11 — Compra com itens; contagem de inventário; carrinho do PDV** (5, uma por sessão).

**Não fazer antes de T7:** animações decorativas, tema novo, ícones novos, gráficos.

---

## 7. Checklist de validação (rodar em toda tarefa)

- Larguras 360, 390 e 430px, e desktop. Sem rolagem horizontal.
- Teclado aberto: botão principal continua visível; campo focado não fica escondido.
- Gesto Voltar do Android e arrastar para baixo fecham o sheet (com guarda se houver alterações).
- Safe area (iPhone com barra inferior): rodapé do sheet e BottomNav não cobrem conteúdo.
- Leitor de tela: título do sheet anunciado, erros ligados aos campos, foco visível.
- Dark mode: primário branco, contraste dos chips de status, foco.
- `prefers-reduced-motion` desliga animações.
- Erro de rede simulado: nada é perdido, mensagem em português, botão "Tentar de novo".
- Registre o que **não** foi testado.

---

## 8. Prompt de abertura (cole no OpenCode junto com este arquivo e com o `mobile-saas-skill.md`)

> Leia `MOBILE-UX-SPEC.md` e `mobile-saas-skill.md` inteiros. Execute **somente** a tarefa T__ da seção 6. Antes de escrever código, liste os arquivos que vai ler e os que vai alterar. Não toque em `services/`, `schema.prisma` nem em regras de venda. Não instale dependências. No fim, rode tsc, lint e testes, liste os arquivos alterados e diga explicitamente o que não conseguiu testar.
