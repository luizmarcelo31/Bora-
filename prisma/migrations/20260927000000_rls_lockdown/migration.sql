-- Lockdown de exposicao: o schema public nao deve ser acessivel via PostgREST.
--
-- Contexto: o app acessa TODOS os dados de negocio via Prisma, que conecta
-- com a role `postgres` (dona das tabelas). A role `postgres` ignora RLS por
-- padrao (sem FORCE ROW LEVEL SECURITY), entao o app nao e afetado.
-- O client Supabase JS (publishable/anon) e usado apenas para `auth.*` e
-- `storage.*` -- nunca para `from()` em tabelas. Logo, `anon` e
-- `authenticated` nao precisam de nenhum privilege no schema public.
--
-- RLS habilitado SEM policy = deny-all para anon/authenticated.
-- RLS nao e aplicado a `auth` nem `storage` (schemas gerenciados pelo Supabase),
-- que continuam disponiveis para o fluxo de login e upload.

-- 1. Revogar privilegios de leitura/escrita nas tabelas publicas existentes.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', r.tablename);
  END LOOP;
END $$;

-- 2. Revogar tambem nos sequences (evita nextval() e leitura de contadores).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon, authenticated', r.sequence_name);
  END LOOP;
END $$;

-- 3. Habilitar RLS em todas as tabelas publicas. Sem policy, todo acesso
--    de anon/authenticated e negado. A role dona (postgres/Prisma) ignora.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 4. Novas tabelas criadas depois desta migration tambem ficam travadas.
--    Prisma roda as migrations como `postgres`, entao e esta role que precisa
--    ter o default privilege ajustado.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 5. Rede de seguranca: remover USAGE no schema public. Sem USAGE no schema,
--    nenhuma tabela e alcancavel mesmo que um GRANT acidental reapareca.
--    Os schemas `auth` e `storage` nao sao afetados -- login e upload seguem.
REVOKE ALL ON SCHEMA public FROM anon, authenticated;
