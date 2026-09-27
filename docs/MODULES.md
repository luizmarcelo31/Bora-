# MODULES

Ordem oficial (PROJECT_FOUNDATION §13). Status em 27/09/2026:

## Fundação — ✅ pronta
Projeto, configuração, banco, ORM, contexto, Design System.

## Core — ✅ pronto
- [x] Autenticação (login/signup/logout + proxy)
- [x] Usuários (API + model)
- [x] Tenants (API GET/POST + model)
- [x] Roles + permissões (libs + página /admin/permissoes)
- [x] Sessão→tenant nas APIs (`requireApiContext`, 401/403)

## Super Admin — ✅ plataforma completa
- [x] Guarda `requireSuperAdmin` + `/unauthorized` + `/admin/*` no proxy
- [x] Shell: sidebar em grupos, trilha (breadcrumb), command palette (Ctrl/Cmd+K)
- [x] Command Center (`/admin`): receita mensal, tickets críticos, auditoria recente
- [x] Empresas: filtro de situação + busca no servidor, paginação, MRR
- [x] Empresa 360 (`/admin/empresas/[id]`): resumo, assinatura, dados, vendas, tickets, auditoria
- [x] Ciclo de vida (TRIAL → ATIVA → SUSPENSA → CANCELADA → ARQUIVADA) com motivo obrigatório
- [x] Planos (`/admin/planos`) e Assinaturas (`/admin/assinaturas`) — valores em centavos
- [x] Suporte (`/admin/suporte`): tickets com SLA por prioridade (1h/4h/8h/24h)
- [x] Comunicações (`/admin/notificacoes`): rascunho ou envio por segmento
- [x] Auditoria da plataforma (`/admin/auditoria`) — `PlatformAuditLog`, `tenantId` opcional
- [x] Configurações (`/admin/configuracoes`) e Saúde (`/admin/saude`)
- [x] Matriz de permissões com rótulos humanos (`/admin/permissoes`)
- [x] Bootstrap via `scripts/bootstrap-admin.cjs`

## Vocabulário — ✅ enums em português
- [x] Banco e código falam português (valores sem acento, por convenção de identificador)
- [x] `src/lib/labels.ts` é a fonte única dos rótulos humanos (com acento)
- [x] `labels.test.ts` falha se um enum novo entrar sem rótulo
- [x] Toda ação destrutiva do admin grava `PlatformAuditLog` com antes/depois

## Operação — ✅ pronto
- [x] Produtos: API + UI (`/dashboard/produtos`) + campos atacado (wholesalePrice/wholesaleMinQuantity)
- [x] Fotos: upload via Storage (`tenant-{id}`, JPG/PNG/WebP 2MB) no dialog de edição + miniatura no catálogo e no PDV
- [x] Categorias: API + UI (`/dashboard/categorias` — TipoCategoria: PRODUTO/FINANCEIRO)
- [x] Estoque: API + UI (`/dashboard/estoque` — saldo, ENTRADA/SAIDA/AJUSTE/PERDA/AVARIA, histórico)
- [x] Inventário: API + UI (`/dashboard/inventario` — TipoInventario: TOTAL/PARCIAL, finalizar)
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
- [x] Relatórios (`/dashboard/relatorios` — vendas paginadas 50/pág, financeiro, top produtos)
- [x] Configurações (`/dashboard/configuracoes` — TenantSettings)
- [x] Auditoria tenant (`/dashboard/auditoria` — filtro servidor q/acao + paginação 50/pág)
- [x] Auditoria plataforma (`/admin/auditoria` — filtro q/acao/empresa + paginação 50/pág)
- [x] Suporte (`/admin/suporte` — filtro q/status/prioridade + paginação 20/pág)
- [x] Assinaturas (`/admin/assinaturas` — filtro q/status + paginação 20/pág)
- [x] Regras puras em `src/lib/plataforma.ts` (MRR, SLA, transições) com `plataforma.test.ts`
- [x] Segurança: `requireSuperAdmin` em `/admin/*`, rate-limit 60/min em `/api/*` no proxy
- [x] Polish: `ThemeToggle` no `AppShell`, `BrandMark` login/sidebar

## Navegação — ✅ sidebar atualizada
- [x] Sidebar tenant com grupos: Operação, Compras, Financeiro, Gestão
- [x] Links: Inventário, Promoções, Compras visíveis na navegação lateral
