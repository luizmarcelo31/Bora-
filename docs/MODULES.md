# MODULES

Ordem oficial (PROJECT_FOUNDATION §13). Status em 24/09/2026:

## Fundação — ✅ pronta
Projeto, configuração, banco, ORM, contexto, Design System.

## Core — ✅ pronto
- [x] Autenticação (login/signup/logout + proxy)
- [x] Usuários (API + model)
- [x] Tenants (API GET/POST + model)
- [x] Roles + permissões (libs + página /admin/permissoes)
- [x] Sessão→tenant nas APIs (`requireApiContext`, 401/403)

## Super Admin — ✅ funcional no visual do kit
- [x] Guarda `requireSuperAdmin` + `/unauthorized` + `/admin/*` no proxy
- [x] Shell (sidebar + header) + empresas, usuários, permissões
- [x] Bootstrap via `scripts/bootstrap-admin.cjs`
- [ ] Planos, assinaturas, configurações

## Operação — ✅ pronto
- [x] Produtos: API + UI (`/dashboard/produtos`) + campos atacado (wholesalePrice/wholesaleMinQuantity)
- [x] Categorias: API + UI (`/dashboard/categorias` — PRODUCT/FINANCIAL)
- [x] Estoque: API + UI (`/dashboard/estoque` — saldo, ENTRADA/SAIDA/AJUSTE/PERDA/AVARIA, histórico)
- [x] Inventário: API + UI (`/dashboard/inventario` — contagem FULL/PARTIAL, finalizar)
- [x] Imagens (Supabase Storage)

## PDV — ✅ pronto + atacado
- [x] PDV: API + UI (`/dashboard/pdv` — carrinho, pagamento, caixa, vendas do dia, cancelar c/ estorno)
- [x] Lógica de preço atacado automática (badge ATACADO ATIVO + preço riscado no PDV)

## Promoções — ✅ pronto
- [x] Promoções: API + UI (`/dashboard/promocoes` — PERCENTAGE/FIXED_AMOUNT/COMBO, vínculo de produtos)

## Compras e Fornecedores — ✅ pronto
- [x] Fornecedores: cadastro com CNPJ, telefone, email
- [x] Compras: registro de nota fiscal, total, status PENDING→RECEIVED, botão "Confirmar recebimento"
- [x] UI em `/dashboard/compras`

## Financeiro — ✅ pronto
- [x] Caixa: API + UI (`/dashboard/caixa` — abrir/fechar c/ diferença + estorno, histórico)
- [x] Financeiro: API + UI (`/dashboard/financeiro` — lançar, resumo do mês, baixa paid/unpay)

## Finalização — ✅ relatórios/config/auditoria prontos
- [x] Relatórios (`/dashboard/relatorios` — vendas, financeiro, top produtos)
- [x] Configurações (`/dashboard/configuracoes` — TenantSettings)
- [x] Auditoria (`/dashboard/auditoria` — 100 últimos logs + trilha nas actions)
- [ ] Testes (Vitest/Playwright), segurança avançada, polish UX.

## Navegação — ✅ sidebar atualizada
- [x] Sidebar tenant com grupos: Operação, Compras, Financeiro, Gestão
- [x] Links: Inventário, Promoções, Compras visíveis na navegação lateral


## Fundação — ✅ pronta
Projeto, configuração, banco, ORM, contexto, Design System.

## Core — ✅ pronto
- [x] Autenticação (login/signup/logout + proxy)
- [x] Usuários (API + model)
- [x] Tenants (API GET/POST + model)
- [x] Roles + permissões (libs + página /admin/permissoes)
- [x] Sessão→tenant nas APIs (`requireApiContext`, 401/403)

## Super Admin — ✅ funcional no visual do kit
- [x] Guarda `requireSuperAdmin` + `/unauthorized` + `/admin/*` no proxy
- [x] Shell (sidebar + header) + empresas, usuários, permissões
- [x] Bootstrap via `scripts/bootstrap-admin.cjs`
- [ ] Planos, assinaturas, configurações

## Operação — ✅ pronto
- [x] Produtos: API + UI (`/dashboard/produtos`)
- [x] Categorias: API + UI (`/dashboard/categorias` — PRODUCT/FINANCIAL, wire em produtos/financeiro)
- [x] Estoque: API + UI (`/dashboard/estoque` — saldo, ENTRADA/SAIDA/AJUSTE, histórico)
- [ ] Imagens (Supabase Storage)

## Financeiro — ✅ pronto
- [x] Caixa: API + UI (`/dashboard/caixa` — abrir/fechar c/ diferença + estorno, histórico)
- [x] Financeiro: API + UI (`/dashboard/financeiro` — lançar, resumo do mês, baixa paid/unpay)

## Conveniência — ✅ pronto
- [x] PDV: API + UI (`/dashboard/pdv` — carrinho, pagamento, caixa, vendas do dia, cancelar c/ estorno)

## Finalização — ✅ relatórios/config/auditoria prontos
- [x] Relatórios (`/dashboard/relatorios` — vendas, financeiro, top produtos)
- [x] Configurações (`/dashboard/configuracoes` — TenantSettings)
- [x] Auditoria (`/dashboard/auditoria` — 100 últimos logs + trilha nas actions)
- [ ] Testes (Vitest/Playwright), segurança avançada, polish UX.
