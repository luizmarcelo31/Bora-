# Relatório de Análise - SaaS Conveniência

## Tech Stack Detectada

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Language | TypeScript | 5.x |
| Framework | Next.js | 16.3.5 |
| UI | React | 19.2.8 |
| Styling | Tailwind CSS | 4.x |
| Components | Radix UI + shadcn/ui | - |
| Database | PostgreSQL (Supabase) | - |
| ORM | Prisma | 6.18.0 |
| Auth | Supabase Auth | - |
| Tests | Vitest + Playwright | - |
| Deploy | Vercel | - |

## Arquitetura

**Multi-tenant SaaS** para gestão de conveniências:
- PDV (Ponto de Venda)
- Estoque e movimentações
- Financeiro (caixa, receitas/despesas)
- Relatórios diários
- Audit log

## Estrutura de Diretórios

```
src/
├── app/
│   ├── (auth)/        # Login/signup
│   ├── admin/         # Painel admin
│   ├── api/           # API routes
│   ├── dashboard/     # Dashboard principal
│   └── login/         # Autenticação
├── components/
│   ├── admin/         # Componentes admin
│   ├── auth/          # Componentes auth
│   ├── shared/        # Componentes compartilhados
│   ├── tenant/        # Componentes tenant
│   └── ui/            # UI primitives (shadcn)
├── lib/               # Utilitários e lógica
├── services/          # Services layer
├── hooks/             # Custom hooks
└── navigation/        # Navegação

prisma/
├── schema.prisma      # Modelo de dados
└── migrations/        # Migrações

tests/
└── e2e/               # Testes Playwright
```

## Comandos

| Ação | Comando |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Test (unit) | `npm test` |
| Test (e2e) | `npm run test:e2e` |
| Lint | `npm run lint` |
| Prisma migrate | `npx prisma migrate dev` |
| Prisma generate | `npx prisma generate` |

---

## Problemas Encontrados

### Críticos

| # | Problema | Local |
|---|----------|-------|
| 1 | Rotas API sem verificação de permissão por role | Todas em `src/app/api/` |
| 2 | Proxy exporta `proxy` em vez de `middleware` | `src/proxy.ts` |

### Altos

| # | Problema | Local |
|---|----------|-------|
| 3 | API routes sem `logAudit()` | Todas em `src/app/api/` |
| 4 | Criação de usuário não cria no Supabase Auth | `src/app/api/users/route.ts` |
| 5 | `cancelSale()` não gera reversão financeira | `src/services/index.ts:573` |

### Médios

| # | Problema | Local |
|---|----------|-------|
| 6 | Sem rota API para Categories | Ausente |
| 7 | Sem rota API para Settings | Ausente |
| 8 | Sem endpoints PUT/PATCH/DELETE | Todas em `src/app/api/` |
| 9 | `toApiError()` retorna 400 para erros DB | `src/lib/api-context.ts:64` |
| 10 | `closeCashBox()` retorna saldo desatualizado | `src/services/index.ts:753` |

### Baixos

| # | Problema | Local |
|---|----------|-------|
| 11 | Email admin hardcoded | `src/lib/admin.ts:11` |
| 12 | `getTenantIdFromHeaders()` código morto | `src/lib/tenant.ts:14-23` |
| 13 | `/api/test` sem auth - expõe dados | `src/app/api/test/route.ts` |
| 14 | `DailyReport` sem service nem rota | `prisma/schema.prisma:329` |

---

## Ações Recomendadas

### Imediato (Corrigir agora)
1. Adicionar `requirePermission()` em todas as rotas API
2. Verificar se `proxy.ts` está funcionando como middleware no Next 16
3. Adicionar `logAudit()` nas rotas API

### Curto prazo (Próximas semanas)
4. Integrar criação de usuário com Supabase Auth
5. Mover reversão financeira para dentro de `cancelSale()`
6. Criar rotas API para Categories e Settings

### Médio prazo
7. Adicionar endpoints PUT/PATCH/DELETE
8. Corrigir `toApiError()` para retornar 500 em erros de DB
9. Mover email admin para variável de ambiente

---

## O Que Precisamos Criar

| Item | Tipo | Prioridade |
|------|------|------------|
| Middleware de permissão para API routes | Segurança | Crítica |
| Rotas API CRUD completas | Funcionalidade | Alta |
| Service para DailyReport | Negócio | Média |
| Testes de integração para fluxo PDV | Qualidade | Alta |
