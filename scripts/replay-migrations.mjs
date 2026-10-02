// Replica TODAS as migrations num schema isolado (qa_baseline) e diz qual
// arquivo quebra o replay do zero -- o mesmo teste que o shadow database do
// `prisma migrate dev` faz, so que com diagnostico por arquivo.
// Nao mexe no schema public. Nao imprime nada do .env.
//
// Uso: node scripts/replay-migrations.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const SCHEMA = 'qa_baseline'

// le a URL do .env sem ecoar
function urlDoEnv() {
  for (const arq of ['.env', '.env.local']) {
    let txt
    try {
      txt = readFileSync(arq, 'utf8')
    } catch {
      continue
    }
    for (const linha of txt.split('\n')) {
      const m = linha.match(/^\s*(?:export\s+)?DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/)
      if (m) return m[1]
    }
  }
  throw new Error('DATABASE_URL nao encontrada em .env/.env.local')
}

const client = new pg.Client({ connectionString: urlDoEnv(), ssl: { rejectUnauthorized: false } })
await client.connect()

// Migration que age explicitamente sobre o schema public fica de fora do teste.
const risky = /ALTER DEFAULT PRIVILEGES|ON SCHEMA public/i

try {
  await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`)
  await client.query(`CREATE SCHEMA "${SCHEMA}"`)
  await client.query(`SET search_path TO "${SCHEMA}", public`)
  console.log(`schema ${SCHEMA} criado\n`)

  const dir = 'prisma/migrations'
  const nomes = readdirSync(dir)
    .filter((n) => !n.includes('migration_lock'))
    .sort()

  let falhou = null
  for (const nome of nomes) {
    let sql
    try {
      sql = readFileSync(join(dir, nome, 'migration.sql'), 'utf8')
    } catch {
      console.log(`SKIP    ${nome} (sem migration.sql)`)
      continue
    }
    if (risky.test(sql)) {
      console.log(`PARCIAL ${nome} (age sobre o schema public; fora do teste)`)
      continue
    }
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('COMMIT')
      console.log(`OK      ${nome}`)
    } catch (e) {
      await client.query('ROLLBACK')
      console.log(`FALHA   ${nome}`)
      console.log(`        ${e.message}`)
      falhou = nome
      break
    }
  }

  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = $1 ORDER BY table_name`, [SCHEMA])
  console.log(`\ntabelas no replay: ${rows.length}`)
  console.log(rows.map((r) => r.table_name).join(', '))

  const { rows: sem } = await client.query(`
    SELECT c.relname AS tabela
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = $1 AND c.relkind = 'r'
    GROUP BY 1 ORDER BY 1`, [SCHEMA])
  console.log(`\nfaltando vs 28 do schema.prisma:`)
  const tem = new Set(sem.map((r) => r.relname ?? r.tabela))
  console.log([...tem].join(', '))
  console.log(falhou ? `\nREPLAY QUEBRA EM: ${falhou}` : '\nREPLAY COMPLETO')
} finally {
  await client.end()
}