# ADMIN mobile — análise e o que mudou

**Data:** 03/10/2026 · Escopo: camada visual e de navegação. Nenhuma regra de
negócio, API, banco, permissão ou query foi tocada.

## O pedido

"Quero que o Super Admin tenha a organização visual mobile igual ao
proprietário, bem polido, igual temos agora."

A primeira leva desta auditoria cuidou das rotas do tenant e, ao passar pelas do
admin, aplicou só o que já existia: `<Valor>` para cor semântica e `<LinhaLista>`
onde já havia lista mobile. Faltou o resto — e o que faltava era **sistêmico**,
não pontual.

## Diagnóstico

### 1. Padding fixo em 14 telas

As 14 páginas do admin usavam `px-6 py-8` — 24px de cada lado, fixos. As 10
principais do tenant usam `px-4 py-5 md:gap-6 md:px-6 md:py-8`.

São 12px de largura desperdiçados em cada lado a 390px, em toda a área do admin.
A conta é direta: o padding do tenant foi acertado na leva anterior e o do admin
ficou para trás.

### 2. KPIs inflados

Seis rotas do admin usavam `MetricCard` em `grid sm:grid-cols-2 xl:grid-cols-4`.
A 390px o grid cai para **uma coluna**, e o `MetricCard` completo tem ~140px:
quatro métricas ocupavam 560px — duas telas e meia de scroll antes do primeiro
gráfico.

O `MetricCard` ganhou duas densidades (compacto abaixo de `sm`), e nasceu o
`KpiFaixa` para as famílias de 3–4 números da mesma espécie. As quatro rotas
mais densas migraram para a faixa.

### 3. Duas tabelas sem variante mobile

`/admin/permissoes` tem **sete colunas** (permissão × 6 funções) dentro de
`overflow-x-auto` — no celular vira scroll horizontal, que o catálogo de padrões
da skill proíbe como solução padrão. `/admin/saude` tem a tabela "Volume de
dados" sem versão mobile nenhuma.

A de permissões inverteu o eixo: uma linha por permissão, com as 6 funções
listadas dentro do card. A tabela de sete colunas continua no desktop.

### 4. Informação que sumia no mobile

Quatro coisas que o desktop mostra e o mobile não:

| Rota | O que sumia |
|---|---|
| `/admin/usuarios` | a **função** do usuário — só existia na tabela |
| `/admin/auditoria` | o **nome da empresa** e o **badge da ação** |
| `/admin/empresas/[id]` | vendas e assinaturas em lista crua |
| `/admin/saude` | — |

### 5. Emoji como ícone

`/admin/permissoes` usava `✅` para "permitido". Emoji renderiza diferente em
cada plataforma e o projeto é Lucide em toda parte. Trocado por ícone.

## O que mudou

### Sistema

**Padding** — 14 arquivos, `px-6 py-8` → `px-4 py-5 md:gap-6 md:px-6 md:py-8`.
Idêntico ao tenant.

**`MetricCard`** — duas densidades. Abaixo de `sm`: sem a caixa do ícone, sem a
linha de descrição duplicada, valor em 16px com peso 700. Acima: o card original,
idêntico ao que era.

O que desaparece no mobile é só a caixa decorativa do ícone — que existe para dar
contexto quando o rótulo sozinho não basta, e em quatro KPIs seguidos o rótulo
basta. O `hint` continua visível, menor. **Nenhum dado foi removido.**

**`KpiFaixa`** — faixa densa, 2 colunas no mobile, 4 no desktop. Nasceu porque o
patch de "cartão inflado → faixa compacta" foi aplicado à mão em seis rotas do
tenant, e o mesmo bloco de três linhas voltou em cada uma.

### Rotas

| Rota | Antes | Depois |
|---|---|---|
| `/admin` | 4 MetricCard, listas manuais | `KpiFaixa` 4 col + `LinhaLista` |
| `/admin/empresas` | lista manual | `LinhaLista` + cor semântica |
| `/admin/empresas/[id]` | 4 MetricCard, vendas em `<ul>` cru | `KpiFaixa` + `LinhaLista` |
| `/admin/empresas/nova` | formulário | padding responsivo |
| `/admin/usuarios` | lista sem função | `LinhaLista` **com função** |
| `/admin/planos` | lista manual | `LinhaLista` + cor semântica |
| `/admin/planos/[id]` | formulário | padding responsivo |
| `/admin/assinaturas` | MetricCard | `KpiFaixa` + `LinhaLista` |
| `/admin/suporte` | MetricCard + lista manual | `LinhaLista` + SLA em atenção |
| `/admin/notificacoes` | lista manual | `LinhaLista` com destinatários |
| `/admin/permissoes` | tabela de 7 colunas com scroll | **eixo invertido** no mobile |
| `/admin/auditoria` | lista sem empresa nem badge | `LinhaLista` completa |
| `/admin/saude` | 4 MetricCard, tabela sem mobile | `KpiFaixa` + lista |
| `/admin/configuracoes` | formulário | padding responsivo |

### Cor semântica no admin

| Dado | Tom |
|---|---|
| MRR, receita da assinatura | positivo |
| Ticket crítico, SLA vencido | atenção |
| Empresa suspensa / cancelada | negativo |
| Assinatura pendente de pagamento | atenção |
| Assinatura cancelada | negativo |
| Empresa sem atividade | atenção |
| Volume de banco | neutro (contagem não é nem boa nem ruim) |

## Uma nota sobre quem usa

A leva anterior decidiu **não** criar layout mobile novo no admin, porque quem
opera a plataforma é a pessoa do computador. Este lote inverteu a decisão, a
pedido explícito — e o argumento continua válido em parte: admin no celular é
para *consultar* e *responder ticket no caminho*, não para operate.

O que isso muda na prioridade: o dinheiro aqui foi nos dois problemas que
afetam as **duas** situações de uso — o padding, que é universal, e a lista de
empresas e assinaturas, que é o que se abre no celular. `/admin/permissoes`
ganhou versão mobile porque a tabela de sete colunas é ilegível em qualquer
tela; mesmo raramente aberta, é o tipo de coisa que o Super Admin abre para
conferir uma dúvida e não encontra.

## Verificação

```
npx tsc --noEmit                          → limpo
node scripts/auditar-cores-hardcoded.mjs   → 0 falhas
node scripts/auditar-contraste.mjs         → 0 falhas
node scripts/auditar-sentence-case.mjs     → sem regressão
```

## Pendência

A prova em navegador das telas do admin exige login de Super Admin
(`luizmarcelodev@gmail.com`). O `.env` do projeto tem a credencial do
proprietário do tenant (`luizmarcelo31@gmail.com`), que recebe 403 em `/admin`.
Sem essa credencial, o que está comprovado aqui é o TypeScript e os gates — não
o pixels.