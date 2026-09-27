/**
 * Cria o bucket público de fotos do tenant no Supabase Storage.
 *
 * Uso:
 *   node --env-file=.env scripts/setup-storage.mjs 3 [4 5...]
 *
 * - Idempotente: bucket existente retorna ok.
 * - Bucket público = leitura sem RLS; escrita continua só via service role.
 * - Precisa de SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) no .env.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const tenants = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0);

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou chave service no .env");
  process.exit(1);
}
if (tenants.length === 0) {
  console.error("Uso: node --env-file=.env scripts/setup-storage.mjs <tenantId> [...]");
  process.exit(1);
}

let falha = false;
for (const id of tenants) {
  const bucket = `tenant-${id}`;
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  const corpo = await res.text();
  if (res.ok || corpo.includes("already exists") || corpo.includes("Duplicate")) {
    console.log(`ok: bucket ${bucket} público`);
  } else {
    falha = true;
    console.error(`falha: bucket ${bucket} → ${res.status} ${corpo.slice(0, 200)}`);
  }
}
process.exit(falha ? 1 : 0);
