# PROJECT FOUNDATION

## SaaS de Gestão para Conveniências

**Versão:** 1.0  
**Status:** Fundação / Projeto iniciado do zero  
**Objetivo:** Estabelecer a visão, arquitetura e regras fundamentais do projeto antes da implementação.

---

# 1. VISÃO DO PRODUTO

O projeto consiste em um SaaS de gestão empresarial inicialmente direcionado ao segmento de **conveniências**.

O primeiro produto deverá atender às principais necessidades operacionais e administrativas de uma conveniência, incluindo:

- Gestão de produtos.
- Controle de estoque.
- PDV.
- Controle de caixa.
- Gestão financeira.
- Relatórios.
- Usuários e permissões.
- Administração da empresa.

O produto deve ser construído de forma modular.

Embora o primeiro segmento seja conveniência, a arquitetura deverá permitir que módulos genéricos sejam posteriormente reutilizados em outros segmentos.

Exemplo:

```text
CORE
├── Usuários
├── Empresas / Tenants
├── Permissões
├── Produtos
├── Estoque
├── Financeiro
└── Relatórios

SEGMENTO: CONVENIÊNCIA
├── PDV
├── Caixa
└── Funcionalidades específicas
```

No futuro, outro segmento poderá reutilizar:

```text
Financeiro
Estoque
Produtos
Usuários
Permissões
Relatórios
```

e adicionar seus próprios módulos.

---

# 2. OBJETIVO DA PRIMEIRA VERSÃO

A primeira versão não tem como objetivo atender a todos os tipos de empresas.

O objetivo é construir um produto funcional e consistente para **conveniências**, com uma fundação técnica suficientemente organizada para permitir evolução futura.

Prioridades:

1. Funcionamento.
2. Simplicidade.
3. Segurança.
4. Isolamento entre empresas.
5. Boa experiência de usuário.
6. Interface profissional.
7. Arquitetura modular.
8. Facilidade de manutenção com auxílio de IA.

Não devemos implementar funcionalidades apenas para tornar o sistema maior.

Uma funcionalidade só deve ser implementada quando existir uma necessidade definida.

---

# 3. PRINCÍPIO ARQUITETURAL

O projeto será um **monólito modular em Next.js**.

Não será criado inicialmente um backend Node separado.

O Next.js será responsável por:

- Interface.
- Rotas.
- Server Components.
- Server Actions.
- Route Handlers.
- Integração com autenticação.
- Regras de negócio.
- Comunicação com o banco.

Arquitetura conceitual:

```text
                    NEXT.JS
                       │
          ┌────────────┴────────────┐
          │                         │
       FRONTEND                  BACKEND
          │                         │
   React / Tailwind          Services / Actions
   shadcn/ui                 Route Handlers
                                    │
                                  Zod
                                    │
                                 Drizzle
                                    │
                                    ▼
                              PostgreSQL
                                    │
                                 Supabase
```

---

# 4. STACK OFICIAL

## Aplicação

- Next.js
- TypeScript
- React

## Interface

- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts, quando necessário

## Backend

- Next.js Route Handlers
- Next.js Server Actions
- Services / camada de negócio

## Banco

- PostgreSQL
- Supabase como infraestrutura do PostgreSQL

## ORM

- Drizzle ORM

## Autenticação

- Supabase Auth

## Validação

- Zod

## Mídia

- ImageKit

O ImageKit será utilizado para imagens e outras mídias quando necessário.

O PostgreSQL deverá armazenar referências/URLs dos arquivos, não necessariamente os arquivos binários.

## Deploy

- Vercel

## Testes

- Vitest
- Playwright

---

# 5. SUPABASE

O Supabase será utilizado principalmente como infraestrutura de:

- PostgreSQL.
- Autenticação, através do Supabase Auth.

O frontend não deve possuir acesso irrestrito ao banco.

A lógica de negócio deve permanecer na aplicação.

Conceitualmente:

```text
Usuário
   ↓
Next.js
   ↓
Autenticação
   ↓
Autorização
   ↓
Tenant
   ↓
Regra de negócio
   ↓
Drizzle
   ↓
PostgreSQL / Supabase
```

---

# 6. ORM

O projeto utilizará Drizzle ORM para acesso ao PostgreSQL.

Responsabilidades:

- Consultas.
- Inserções.
- Atualizações.
- Relacionamentos.
- Tipagem.
- Migrations.

O schema do banco deverá ser tratado como parte fundamental da arquitetura.

Alterações estruturais no banco devem ser realizadas através de migrations e documentadas.

---

# 7. MULTI-TENANCY

O SaaS será multi-tenant.

Um **tenant representa uma empresa dentro da plataforma**.

Exemplo:

```text
SaaS
│
├── Tenant A
│   └── Conveniência Central
│
├── Tenant B
│   └── Conveniência Norte
│
└── Tenant C
    └── Conveniência Sul
```

Os dados operacionais pertencem ao tenant.

Exemplo:

```text
products
├── id
├── tenant_id
├── name
├── price
└── ...
```

O mesmo princípio deverá ser aplicado às entidades que pertencem à empresa.

Exemplos:

- Produtos.
- Estoque.
- Vendas.
- Financeiro.
- Clientes.
- Categorias.
- Movimentações.

Uma empresa jamais deverá conseguir acessar dados pertencentes a outro tenant.

---

# 8. TENANT TYPE

O tenant possuirá um tipo/segmento.

Inicialmente:

```text
tenant.type = CONVENIENCE
```

A arquitetura poderá suportar posteriormente:

```text
CONVENIENCE
RESTAURANT
RETAIL
SERVICE
...
```

Entretanto, outros segmentos **não serão implementados na primeira versão**.

O objetivo é preparar a arquitetura, não antecipar todos os produtos futuros.

---

# 9. TENANT ≠ USUÁRIO

Tenant representa a empresa.

Usuário representa uma pessoa que possui acesso à plataforma.

Exemplo:

```text
Tenant
└── Conveniência Central
      │
      ├── João
      ├── Maria
      ├── Pedro
      └── Ana
```

Os usuários poderão possuir diferentes roles e permissões.

---

# 10. SUPER ADMIN

O Super Admin pertence ao nível da plataforma, e não ao tenant operacional.

Estrutura:

```text
PLATAFORMA
│
└── SUPER ADMIN
       │
       ├── Tenant A
       ├── Tenant B
       └── Tenant C
```

O Super Admin poderá administrar a plataforma.

Possíveis responsabilidades:

- Visualizar empresas.
- Criar empresas.
- Editar empresas.
- Suspender empresas.
- Gerenciar usuários.
- Gerenciar planos.
- Gerenciar assinaturas.
- Visualizar informações globais.
- Configurar aspectos da plataforma.

O Super Admin não deve ser tratado simplesmente como um usuário comum de uma empresa.

---

# 11. ROLES

Roles representam o nível de acesso do usuário dentro de um tenant.

Exemplos iniciais:

```text
OWNER
MANAGER
FINANCIAL
STOCK
CASHIER
```

Essas roles não devem ser vinculadas exclusivamente ao segmento.

Por exemplo:

```text
FINANCIAL
```

pode ser utilizado em:

- Conveniência.
- Restaurante.
- Loja.
- Outros segmentos futuros.

O sistema deve separar:

```text
TENANT
↓
Qual empresa?

TENANT TYPE
↓
Qual segmento?

ROLE
↓
Qual função do usuário?

PERMISSION
↓
O que ele pode fazer?
```

---

# 12. CORE VS SEGMENTO

A arquitetura deverá separar funcionalidades compartilhadas de funcionalidades específicas.

## Core / módulos compartilháveis

Possíveis módulos:

```text
Auth
Users
Tenants
Roles
Permissions
Products
Inventory
Finance
Reports
Settings
```

## Conveniência

Funcionalidades específicas:

```text
POS / PDV
Cashier / Caixa
Operações específicas de conveniência
```

No futuro:

```text
Restaurant
├── Mesas
├── Cardápio
└── Cozinha
```

poderá reutilizar:

```text
Products
Inventory
Finance
Users
Roles
Reports
```

sem duplicar esses sistemas.

---

# 13. MÓDULOS DA PRIMEIRA VERSÃO

A implementação deverá seguir aproximadamente esta ordem:

## Fundação

- Projeto.
- Configuração.
- Banco.
- ORM.
- Contexto.
- Design System.

## Core

- Autenticação.
- Usuários.
- Tenants.
- Roles.
- Permissões.

## Super Admin

- Dashboard.
- Empresas.
- Usuários.
- Planos.
- Assinaturas.
- Configurações.

## Operação

- Produtos.
- Categorias.
- Imagens.
- Estoque.
- Movimentações.

## Financeiro

- Categorias financeiras.
- Contas a pagar.
- Contas a receber.
- Caixa.
- Fluxo financeiro.

## Conveniência

- PDV.
- Vendas.
- Pagamentos.
- Fechamento de caixa.

## Finalização

- Relatórios.
- Auditoria.
- Testes.
- Segurança.
- Melhorias de UX.

---

# 14. DESIGN E UI

A interface atual do projeto anterior não será utilizada como referência obrigatória.

O novo projeto deverá possuir uma identidade visual profissional e consistente.

Tailwind CSS e shadcn/ui serão utilizados como ferramentas, não como identidade visual pronta.

A interface deverá possuir um Design System próprio.

Principais princípios:

- Hierarquia visual clara.
- Espaçamento consistente.
- Tipografia consistente.
- Componentes reutilizáveis.
- Estados de loading.
- Estados vazios.
- Estados de erro.
- Feedback visual.
- Responsividade.
- Acessibilidade.
- Consistência entre páginas.

Não criar cada tela com estilos arbitrários.

Antes de criar novas telas, utilizar os componentes existentes sempre que possível.

---

# 15. COMPONENTES

A aplicação deverá possuir componentes reutilizáveis.

Exemplos:

```text
components/
├── ui/
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Dialog
│   ├── Table
│   └── ...
│
└── shared/
    ├── PageHeader
    ├── MetricCard
    ├── DataTable
    ├── EmptyState
    ├── ErrorState
    ├── LoadingState
    ├── ConfirmDialog
    └── ...
```

Componentes específicos de um módulo devem permanecer próximos daquele módulo quando não houver motivo para torná-los globais.

---

# 16. REGRAS DE NEGÓCIO

As regras de negócio não devem ficar espalhadas arbitrariamente pelos componentes de interface.

Conceitualmente:

```text
UI
 ↓
Action / API
 ↓
Service
 ↓
Database
```

Exemplo:

```text
Criar venda
 ↓
Validar dados
 ↓
Verificar usuário
 ↓
Verificar tenant
 ↓
Verificar permissão
 ↓
Verificar estoque
 ↓
Criar venda
 ↓
Baixar estoque
 ↓
Registrar pagamento
 ↓
Registrar movimentação financeira
```

A interface não deve ser responsável por garantir sozinha essas regras.

---

# 17. ESTOQUE

O estoque deverá ser baseado em movimentações, e não apenas em alteração direta de um número.

Exemplo:

```text
stock_movements

id
tenant_id
product_id
type
quantity
reason
created_at
```

Movimentações podem representar:

```text
ENTRADA
SAIDA
AJUSTE
TRANSFERENCIA
VENDA
```

A implementação final deverá definir os tipos necessários de acordo com os requisitos do produto.

Isso permitirá histórico e auditoria.

---

# 18. FINANCEIRO

O módulo financeiro deverá ser desenvolvido como módulo potencialmente reutilizável.

Possíveis recursos:

```text
Finance
├── Categorias
├── Contas a pagar
├── Contas a receber
├── Caixa
├── Fluxo de caixa
└── Relatórios
```

O módulo não deve conter regras específicas de conveniência quando essas regras puderem ser generalizadas.

---

# 19. PDV

O PDV será uma funcionalidade específica do primeiro segmento.

O PDV deverá integrar-se aos módulos existentes.

Conceito:

```text
Venda
│
├── Produtos
├── Estoque
├── Pagamento
├── Caixa
└── Financeiro
```

Uma venda concluída poderá:

- Registrar a venda.
- Atualizar estoque.
- Registrar pagamento.
- Atualizar caixa.
- Gerar movimentação financeira.

As regras exatas serão definidas no PRD específico do módulo.

---

# 20. STORAGE E MÍDIA

O ImageKit será utilizado para armazenamento e entrega de mídia.

Exemplo:

```text
Produto
├── id
├── name
└── image_url
             ↓
          ImageKit
```

O banco deverá armazenar os metadados necessários e a referência ao arquivo.

Credenciais privadas nunca deverão ser expostas no frontend.

---

# 21. SEGURANÇA

Segurança deve ser tratada desde o início.

Regras fundamentais:

- Nunca confiar no frontend para autorização.
- Verificar autenticação no servidor.
- Verificar tenant no servidor.
- Verificar permissões no servidor.
- Validar entradas com Zod.
- Não expor secrets.
- Não permitir acesso cruzado entre tenants.
- Evitar operações destrutivas sem confirmação.
- Registrar operações importantes quando necessário.

---

# 22. TESTES

O projeto deverá possuir testes desde o desenvolvimento inicial.

## Unitários

Utilizar Vitest para:

- Regras de negócio.
- Funções.
- Validações.
- Cálculos.

## E2E

Utilizar Playwright para fluxos críticos.

Exemplos:

```text
Login
 ↓
Dashboard

Criar produto
 ↓
Produto aparece na lista

Registrar venda
 ↓
Estoque é atualizado
 ↓
Caixa é atualizado
```

Correções de bugs importantes deverão, quando possível, possuir um teste que reproduza o problema.

---

# 23. DOCUMENTAÇÃO CONTÍNUA

A documentação é parte do desenvolvimento.

Após uma alteração relevante, atualizar os documentos necessários.

O projeto deverá manter:

```text
/docs

PRD.md
ARCHITECTURE.md
DATABASE.md
AUTH.md
TENANCY.md
PERMISSIONS.md
DESIGN_SYSTEM.md
MODULES.md
ROADMAP.md
PROJECT_STATE.md
AI_RULES.md

/docs/decisions
/docs/changes
```

---

# 24. REGRA DE CONTEXTO DA IA

A IA deverá consultar o contexto antes de implementar alterações.

Ordem mínima:

```text
AI_RULES.md
       ↓
PROJECT_STATE.md
       ↓
PRD.md
       ↓
Documentação do módulo
       ↓
Código existente
       ↓
Implementação
```

Após implementar:

```text
Código
 ↓
Testes
 ↓
Documentação
 ↓
Change Log
 ↓
PROJECT_STATE.md
```

A documentação não deve ser tratada como opcional.

---

# 25. REGRA CONTRA ESCALADA DE COMPLEXIDADE

O projeto deve utilizar a solução mais simples que atenda corretamente ao requisito.

Não adicionar:

- Microsserviços.
- Servidores separados.
- Filas.
- Redis.
- Infraestrutura complexa.
- Dependências desnecessárias.

Esses recursos só devem ser adicionados quando houver necessidade técnica comprovada.

A primeira versão será projetada para um número pequeno de usuários.

Simplicidade e confiabilidade possuem prioridade sobre complexidade prematura.

---

# 26. FLUXO DE DESENVOLVIMENTO

Nenhuma tarefa relevante deverá ser implementada diretamente sem planejamento.

Fluxo:

```text
REQUISITO
   ↓
ANÁLISE
   ↓
PLANO
   ↓
IMPLEMENTAÇÃO
   ↓
TESTES
   ↓
REVISÃO
   ↓
DOCUMENTAÇÃO
   ↓
REGISTRO DA ALTERAÇÃO
   ↓
ATUALIZAÇÃO DO ESTADO
```

Cada tarefa deve ser pequena o suficiente para que seja possível identificar claramente:

- O que mudou.
- Por que mudou.
- Quais arquivos mudaram.
- Quais testes foram executados.
- Quais efeitos colaterais existem.

---

# 27. REGRA DE ALTERAÇÃO

A IA não deve realizar alterações não relacionadas à tarefa atual.

Exemplo:

Se a tarefa é:

> Criar cadastro de produtos.

Não deve simultaneamente:

- Refazer autenticação.
- Modificar o middleware.
- Alterar o financeiro.
- Trocar a biblioteca de UI.
- Refatorar o banco inteiro.

Se encontrar um problema fora do escopo, deve registrar e informar.

---

# 28. REGRA DE BUG

Quando um bug for encontrado:

```text
1. Reproduzir.
2. Identificar causa.
3. Isolar o problema.
4. Criar/atualizar teste.
5. Corrigir.
6. Executar testes relacionados.
7. Verificar regressões.
8. Documentar a correção.
```

É proibido tentar resolver bugs através de alterações aleatórias em vários arquivos.

---

# 29. ESTADO DO PROJETO

O arquivo `PROJECT_STATE.md` deverá sempre refletir o estado atual real do sistema.

Ele deverá informar:

- O que está implementado.
- O que está em desenvolvimento.
- O que ainda não foi implementado.
- Bugs conhecidos.
- Bloqueios.
- Próxima tarefa.
- Últimas decisões relevantes.

A IA não deverá considerar uma funcionalidade concluída apenas porque o código foi criado.

Uma funcionalidade somente será considerada concluída quando estiver implementada, validada e documentada conforme o nível de teste necessário.

---

# 30. DECISÕES ARQUITETURAIS

Mudanças relevantes deverão gerar registros de decisão.

Exemplos:

```text
ADR-001-stack.md
ADR-002-auth.md
ADR-003-tenancy.md
ADR-004-storage.md
ADR-005-modular-architecture.md
```

Uma decisão registrada não deverá ser alterada silenciosamente.

Se uma decisão precisar ser substituída, criar uma nova decisão ou atualizar formalmente a anterior, explicando o motivo.

---

# 31. PRINCÍPIO FINAL

O objetivo deste projeto não é produzir o máximo de código.

O objetivo é produzir um sistema:

- Funcional.
- Confiável.
- Organizado.
- Visualmente profissional.
- Seguro.
- Modular.
- Documentado.
- Compreensível por humanos.
- Compreensível por IA.
- Preparado para evolução.

A IA deve agir como uma ferramenta de desenvolvimento dentro da arquitetura definida, e não como responsável por decidir sozinha a arquitetura do produto.

Sempre que houver dúvida relevante sobre arquitetura, segurança, banco, autenticação ou escopo, a IA deverá interromper a implementação e apresentar o problema antes de tomar uma decisão estrutural.

---

# 32. PRIMEIRO OBJETIVO

Antes de implementar funcionalidades comerciais, o projeto deverá alcançar o seguinte estado:

```text
Projeto Next.js funcionando
        ↓
Tailwind + Design System
        ↓
shadcn/ui configurado
        ↓
Supabase conectado
        ↓
PostgreSQL funcionando
        ↓
Drizzle configurado
        ↓
Supabase Auth funcionando
        ↓
Tenant funcionando
        ↓
Roles funcionando
        ↓
Super Admin funcionando
        ↓
Primeiro módulo comercial
```

A partir daí, a implementação dos módulos deverá seguir o roadmap definido no PRD.

**Não iniciar PDV, estoque ou financeiro antes que a fundação necessária esteja estável.**
