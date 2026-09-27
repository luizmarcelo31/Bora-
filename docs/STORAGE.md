# STORAGE — imagens de produto

**Decisão:** ADR-002 (Supabase Storage no MVP, bucket por tenant).

## Como funciona
- Upload SEMPRE no servidor (`uploadProductImageAction`), com service role
  (`src/lib/supabase/service.ts`). Credencial nunca chega ao frontend.
- Bucket por tenant: `tenant-{id}`, público (só leitura).
- Objeto: `produtos/{productId}/{uuid}.{ext}` — UUID evita colisão e cache velho.
- No banco fica só a URL (`Product.imageUrl`). Troca apaga a foto antiga; remoção limpa URL + objeto.
- Limites: JPG/PNG/WebP até 2MB (`src/lib/storage.ts`).

## Setup (ambiente com banco, 1 vez)
```sql
-- Bucket público do tenant 3 (repetir por tenant: tenant-{id})
insert into storage.buckets (id, name, public)
values ('tenant-3', 'tenant-3', true)
on conflict (id) do nothing;

-- Leitura pública
create policy "leitura publica fotos"
on storage.objects for select
using (bucket_id like 'tenant-%');

-- Escrita só via service role (bypassa RLS; sem policy de insert/update/delete)
```

Sem `SUPABASE_SERVICE_ROLE_KEY` a action falha com erro `storage`
e a UI orienta para este arquivo. No Supabase novo a chave secreta
(`sb_secret_...`, `SUPABASE_SECRET_KEY`) equivale ao antigo service_role:
o código aceita qualquer um dos dois nomes de env. Sem bucket, o upload retorna `storage` também.

## Testes
- `src/lib/storage.test.ts`: validação, nomes, upload/remoção com mock (sem rede).
- E2E com escrita real: pendente de credencial + bucket (mesma regra de `E2E_WRITE=1`).
