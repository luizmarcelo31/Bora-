// Reproduz EXATAMENTE o que o shadow database do Prisma faz: cria um banco
// novo, aplica as migrations em ordem, sem mexer em nada do public.
// A diferenca para scripts/replay-migrations.mjs (que usa um SCHEMA) e
// justamente o search_path: aqui roda no schema public, como o Prisma faz.
// Não imprime nada do .env.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const SHADOW = 'qa_shadow_hermes'
const alvo = process.argv[2] ?? null // opcional: aplica so ate esta migration

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
  throw new Error('DATABASE_URL nao encontrada')
}

function urlDoBanco(nome) {
  const u = new URL(urlDoEnv())
  u.pathname = `/${nome}`
  return u.toString()
}

const admin = new pg.Client({ connectionString: urlDoEnv(), ssl: { rejectUnauthorized: false } })
await admin.connect()
await admin.query(`DROP DATABASE IF EXISTS "${SHADOW}"`)
await admin.query(`CREATE DATABASE "${SHADOW}"`)
await admin.end()
console.log(`banco ${SHADOW} criado (search_path = public)\n`)

const db = new pg.Client({ connectionString: urlDoBanco(SHADOW), ssl: { rejectUnauthorized: false } })
await db.connect()

const dir = 'prisma/migrations'
const nomes = readdirSync(dir)
  .filter((n) => !n.includes('migration_lock'))
  .sort()

let falhou = null
for (const nome of nomes) {
  if (alvo && nome > alvo) break
  let sql
  try {
    sql = readFileSync(join(dir, nome, 'migration.sql'), 'utf8')
  } catch {
    console.log(`SKIP    ${nome}`)
    continue
  }
  try {
    await db.query('BEGIN')
    await db.query(sql)
    await db.query('COMMIT')
    console.log(`OK      ${nome}`)
  } catch (e) {
    await db.query('ROLLBACK')
    console.log(`FALHA   ${nome}`)
    console.log(`        ${e.message}`)
    falhou = nome
    break
  }
}

const { rows } = await db.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' ORDER BY table_name`)
console.log(`\ntabelas: ${rows.length}`)
console.log(falhou ? `\nQUEBRA EM: ${falhou}` : '\nSHADOW COMPLETO')

await db.end()
await admin.query(`DROP DATABASE IF EXISTS "${SHADOW}"`).catch(() => {})
await admin.end()