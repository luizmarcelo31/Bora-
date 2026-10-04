# Privacidade da plataforma

O BoraMais é um SaaS multi-tenant. Cada empresa cadastrada tem o seu caixa, o
seu catálogo, as suas vendas. **Nada disso pertence à plataforma.**

Este documento diz onde a linha está, porque uma linha que só existe na cabeça de
quem programou não sobrevive à próxima feature.

## A regra

> A plataforma vê **quantas empresas existem, que plano cada uma paga, quantos
> usuários ela tem e quando ela usou o produto pela última vez.**
> A plataforma **não vê** o que a empresa vende, quanto ela fatura, quais
> produtos ela tem nem quanto estoque ela carrega.

A justificativa não é jurídica, é comercial. O dono da conveniência só entrega
os dados do negócio dele a quem ele confia. Se a plataforma puder olhar o caixa da
loja, a confiança vira bandeira e a concorrência vira alternativa real. Um produto
que o cliente usa porque **precisa** não pode carregar o medo de ser observado —
e o medo, quando é justificado, é o que faz o cliente voltar para o caderninho.

## O que foi removido do `/admin`

| Tela | Antes | Agora |
|---|---|---|
| `/admin` | KPI "Vendas concluídas" somando todas as empresas | "Empresas com uso recente" (7 dias) |
| `/admin` | Tabela "Estoque Crítico" com `product.name` dos clientes | Removida |
| `/admin` | "Empresas com mais movimento", ordenada por `lastActivityAt` e mostrando `_count.sales` | "Empresas com uso mais recente", mostrando *quando* |
| `/admin/empresas` | Colunas "Produtos" e "Vendas"; apoio `"12 usuários · 340 vendas"` | Coluna "Último uso" |
| `/admin/empresas/[id]` | `sale.findMany` (5 últimas com valor), `sale.aggregate` (faturamento total), tabela "Vendas recentes" | Card "Uso" com `lastActivityAt` |
| `/admin/saude` | Linhas "Produtos no catálogo" e "Vendas concluídas" na tabela de volume | Linha "Usuários" |

O caso do **estoque crítico** era o mais silencioso dos seis. A consulta era
`inventory.findMany({ include: { product: { select: { name: true } } } })` — e a
tela renderizava "Coca-Cola 2L zerado no Depósito X". Isso não é dado do cliente
por acaso: é o nome do produto que ele vende e o fato de que ele parou de vender.
Nenhum dos dois é asunto da plataforma.

### O que continua visível, e por quê

**Usuários.** A contagem de usuários é dado de faturamento, não de negócio: é o
que a plataforma precisa para cobrar o limite do plano (`maxUsers`). Sem isso o
plano vira um rótulo de marketing. Ver item 2 em `docs/decisions/`.

**Ticket e auditoria.** O cliente abriu o chamado. O conteúdo é dele e o canal é
dele.

**Planos e limites.** `maxProducts`, `maxSalesPerMonth` são **a definição do
plano**, não a medição de um cliente. Ver o catálogo em `/admin/planos`.

## A alternativa que substituiu os números de venda

Cortou-se a métrica, mas não a pergunta. "Vendeu 340" respondia a pergunta errada
para quem opera a plataforma. Quem investe quer saber **se o produto está sendo
usado**, e a resposta honesta é *"quantas empresas entram nele"* — não quantas
vendas existem, que é um número que o cliente escolhe, não que a plataforma
influencia.

O sinal é `Tenant.lastActivityAt`, gravado em `src/lib/atividade.ts` por dois
motivos: **login** e **venda**. Ele guarda *quando*, nunca *o quê*.

## Limites desta fronteira

**`PlatformAuditLog` registra ação administrativa, não operação do tenant.** Os
dois logs são separados de propósito (`src/lib/platform-audit.ts`): o
`AuditLog` do tenant guarda a operação da loja e não é lido pelo `/admin`.

**O suporte continua vendo o que o cliente escreve.** Se o dono digita "não
consigo lançar a venda 402", o ticket tem esse conteúdo. Isso é atendimento, não
vigilância — e o próprio cliente escolheu escrever.

**O MRR é dado da plataforma.** `Plan.monthlyPrice` é o que o cliente paga à
plataforma. Não há contradição entre "não vejo suas vendas" e "vejo quanto você me
paga".

## Como manter

Qualquer campo novo em `Tenant`, `Sale`, `Product`, `Inventory` ou
`FinancialMovement` que apareça em `/admin` precisa de uma justificativa escrita
aqui antes. A verificação é uma linha de comando:

```
grep -rn "prisma\.\(sale\|product\|inventory\|financialMovement\)" src/app/admin/
```

Saída vazia é o estado esperado. Qualquer hit é uma revisão, não um acidente.