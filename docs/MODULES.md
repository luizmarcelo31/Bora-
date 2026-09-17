# MODULES

Ordem oficial (PROJECT_FOUNDATION §13). Status em 17/09/2026:

## Fundação — ✅ pronta
Projeto, configuração, banco, ORM, contexto, Design System.

## Core — 🟡 parcial
- [x] Autenticação (login/signup/logout + proxy)
- [x] Usuários (API + model)
- [x] Tenants (API GET/POST + model)
- [x] Roles + permissões (libs, sem UI)
- [ ] Vincular sessão→tenant nas APIs (remover X-Tenant-Id manual)

## Super Admin — ⬜ pendente
Dashboard, empresas, usuários, planos, assinaturas, configurações.

## Operação — 🟡 APIs prontas, UI pendente
- [x] Produtos (API) · [ ] UI
- [x] Estoque/movimentações (API) · [ ] UI
- [ ] Categorias e imagens (Supabase Storage)

## Financeiro — 🟡 APIs prontas, UI pendente
Categorias, contas a pagar/receber, caixa, fluxo.

## Conveniência — 🟡 APIs prontas, UI pendente
PDV, vendas, pagamentos, fechamento de caixa.

## Finalização — ⬜ pendente
Relatórios, auditoria, testes, segurança, polish UX.
