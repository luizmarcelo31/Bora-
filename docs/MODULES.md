# MODULES

Ordem oficial (PROJECT_FOUNDATION §13). Status em 17/09/2026:

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

## Operação — 🟡 parcial
- [x] Produtos: API + UI (`/dashboard/produtos` — lista, cadastro em R$, ativa/desativa)
- [x] Estoque/movimentações (API) · [ ] UI
- [ ] Categorias e imagens (Supabase Storage)

## Financeiro — 🟡 APIs prontas, UI pendente
Categorias, contas a pagar/receber, caixa, fluxo.

## Conveniência — 🟡 APIs prontas, UI pendente
PDV, vendas, pagamentos, fechamento de caixa.

## Finalização — ⬜ pendente
Relatórios, auditoria, testes, segurança, polish UX.
