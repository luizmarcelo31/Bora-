# Três pendências fechadas + trava de gate no pre-commit

**Data:** 08/10/2026 · **Autor:** Luiz Marcelo

## Pendência 1 — nome acessível em `Select` (não era bug, era gate ausente)

A pendência dizia "3 `<Select>` sem nome acessível em `/dashboard/produtos`".
**Medindo em navegador, não se confirmou:** os dois `SelectField` da tela têm
nome acessível, e varrendo 28 rotas com a árvore de acessibilidade real do
Chromium (CDP `getFullAXTree`), nenhum campo ficou sem nome.

O que o gate achou, em outra tela: **o `Select` de caixa do PDV Expresso**. O
`SelectTrigger` do Radix é `<button role="combobox">`, e button não é
form-control nativo — o `<label>` envolvente rotula o hidden input, não ele. E
o `placeholder` ("Sem caixa") é valor de estado, não rótulo: some quando há
seleção, então nunca serve de nome.

Correção no componente, não no call site: `label` agora é **obrigatório** em
`ControlledSelect`, aplicado aos 3 usos (PDV clássico, PDV Expresso, diálogo de
fechar caixa). Um campo sem nome passa a ser erro de tipo, não revisão manual.

`tests/e2e/accessible-names.spec.ts` (novo) — mede 68 campos em 28 rotas pelos
papéis `combobox`, `textbox`, `searchbox`, `spinbutton`, `checkbox`, `radio`.
Cobre WCAG 4.1.2 (nome, papel, valor) e 3.3.2 (rótulo). Timeout próprio de
900s: 28 rotas em dev, compilando por rota.

## Pendência 2 — verificação do modo offline (achou um bug de dinheiro)

O roteiro manual de `docs/changes/2026-10-02-modo-offline-pdv.md` é de cinco
passos e precisa de operador. `scripts/verificar-offline.mjs` automatiza a
parte que um script cobre: corta a rede **de verdade** (`context.setOffline`,
sem mock de `fetch`), vende, reconecta, confere fila e banco. Passos que
precisam de dois dispositivos continuam manuais e o script diz quais.

### Quatro bloqueios no caminho, todos reais

1. **O tenant de teste estava vazio** — zero produtos. Sem produto não há venda
   para enfileirar, e o roteiro nunca teria dito nada.
2. **A conta de teste estava como FUNCIONARIO**, sem `sales.create`: o PDV
   devolvia 403. Requer PROPRIETARIO, GERENTE ou CAIXA.
3. **A grade do Express abre em "★ Mais vendidos".** Sem vendas recentes a
   lista está vazia e a tela mostra "Toque num produto para começar", com o
   catálogo inteiro cacheado. Parece quebrado e não está.
4. **CONFIRMAR fica desabilitado sem o valor recebido.** `canConfirmSingle`
   exige `received >= total` em pagamento DINHEIRO. Com o ticket cheio e o
   botão cinza, a venda nunca fecha e a fila fica vazia — sem erro nenhum.

Nenhum desses está no roteiro manual.

### O bug que o roteiro achou

Depois dos quatro ajustes, a venda entrou na fila e **sincronizou no banco** —
mas a entrada da fila **não saiu**. Venda #3 gravada com `offline=true`,
`idempotencyKey` idêntica à da entrada presa, `tentativas: 1`,
`ultimoErro: "Failed to fetch"`.

Causa: `createSaleAction` tem um `catch` genérico que devolve
`{ error: "sale" }` para **qualquer** falha inesperada — e o bloco de auditoria
(`logAudit`) e o `revalidatePath` rodam **depois** do `create`. O reconciliador
tratava `"sale"` como erro desconhecido e **bloqueava** a entrada. Dinheiro no
banco, venda presa na fila, e o operador sem nenhuma pista de que sincronizou.

Correção: `{ error: "rede" }`, que o `paraResultado` traduz para `erro_de_rede` e
faz **reenfileirar**. O reenvio bate na `idempotencyKey` e vira no-op no banco
(`services/index.ts` trata replay). Reenviar é barato; venda presa é dinheiro
invisível.

Verificado: 7 vendas offline, **0 chave repetida, 0 venda sem chave, 0
perdida**.

Testes: `src/lib/offline/reconcile.test.ts` (16) trava o destino da venda para
cada resposta do servidor e a integridade da fila no storage;
`src/lib/offline/action-contract.test.ts` (7) trava o contrato action →
reconciliador, com o caso `"rede"` escrito como regressão.

## Pendência 3 — `migrate dev`: não é bug do projeto

`npx prisma migrate dev` continua falhando. **Não há o que corrigir:** é defeito
do shadow do Prisma 6.19.3 com Supabase (P3006/P1014), registrado em
`docs/changes/2026-10-02-baseline-migrations.md`. O caminho oficial
(`migrate diff` + `migrate deploy`) funciona, e `prisma migrate status` reporta
14 migrations com o schema em dia.

O que mudou foi a porta de entrada: agora há `npm run verify:offline` para o
que precisa de navegador, e o resto não depende do `migrate dev`.

## Pre-commit com os gates

`scripts/gate-design-system.mjs` + `scripts/instalar-hook.mjs` + `.git/hooks/`.

Rodar `npm run gate` a cada commit: `tsc`, suíte unitária, contraste WCAG,
cor fora do token, pesos tipográficos.

**`.git/hooks/` não é versionado.** Sem o instalador, quem clona fica sem
trava nenhuma — que foi exatamente como os gates ficaram vermelhos no main.
O hook local tem 4 linhas e chama `npm run gate`; a lógica está no script, que é
versionado. `npm run gate:hook` regenera.

### Dois bugs do próprio gate, achados testando com violação real

**`auditar-cores-hardcoded.mjs` saía com status 0 achando violação.** Imprimia
o achado e não setava `exitCode`, então o gate lia "ok". A violação aparecia na
tela e o commit passava. Agora seta `process.exitCode = 1`.

**O gate não pegava `color: red-500` em CSS cru.** A regex só cobria
utilitária do Tailwind (`text-red-500`); a forma de propriedade CSS
(`color: red-500`) passava. Segunda passagem agora cobre `color:`,
`background-color:`, `border-color:` e mais.

O primeiro teste do hook "passou" com a violação presente e eu quase aceitei
que o gate estava funcionando — só notei porque a saída dizia "5 ok" quando
deveria ter dito 4. **Gate que nunca reprovou não é gate**: agora há uma
violação de cada forma no histórico deste lote para não confiar no "ok".

## Verificação

- `tsc` limpo; **305 testes / 32 suítes** (+5 desde 08/10).
- `npm run gate`: **5/5 verdes**.
- `accessible-names.spec.ts`: 68 campos, 28 rotas, 0 sem nome.
- `menu-permission.spec.ts` e `typography.spec.ts` verdes com conta real.
- `verificar-offline.mjs`: **5/5**, com 0 duplicação no banco.
- Lint sem regressão introduzida aqui.