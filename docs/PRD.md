# PRD — BoraMais SaaS de Conveniências

**Versão:** 1.0 · **Status:** Fundação pronta, módulos comerciais pendentes

## 1. Problema
Conveniências precisam de gestão simples (produtos, estoque, PDV, caixa, financeiro) sem sistemas caros e complexos.

## 2. Usuários
- **Owner/Manager:** cadastra produtos, acompanha caixa e financeiro.
- **Cashier:** opera PDV e caixa.
- **Stock/Financial:** movimentam estoque e financeiro.
- **Super Admin (plataforma):** gerencia tenants.

## 3. Escopo v1
- [x] Fundação: Next.js, Supabase, Prisma, Auth, tenant, roles
- [x] APIs: tenants, products, users, sales, stock, cashbox, financial
- [ ] Super Admin UI
- [ ] PDV UI, produtos UI, estoque UI, caixa UI, financeiro UI
- [ ] Relatórios e auditoria

## 4. Fora do escopo v1
Microsserviços, filas, Redis, ImageKit, testes E2E completos (ver PROJECT_FOUNDATION §25).

## 5. Regras de negócio (resumo)
- Valores em centavos (sem float).
- Estoque por movimentação (ENTRADA/SAIDA/AJUSTE/VENDA/DEVOLUCAO/TRANSFERENCIA).
- Venda valida estoque, desconto, caixa aberto; baixa estoque + atualiza caixa em transação.
- Cancelamento reverte estoque e caixa.
- Isolamento total por `tenantId` — ver TENANCY.md.
- Permissões por role — ver PERMISSIONS.md.
