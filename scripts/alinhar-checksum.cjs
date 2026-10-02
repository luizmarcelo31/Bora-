/*
 * Alinha o checksum de uma migration que foi editedada depois de aplicada.
 *
 * Por que: em 02/10/2026 a migration 20260929090000_add_plans_subscriptions foi
 * tornada idempotente (IF NOT EXISTS / DO $$) para o replay do zero funcionar.
 * Ela ja estava marcada como `applied` no banco, entao o sha256 guardado em
 * `_prisma_migrations.checksum` passou a divergir do arquivo em disco.
 *
 * O SQL aplicavel NAO mudou no banco de producao (a migration nunca roda la,
 * esta marcada como applied): a mudanca afeta apenas shadow / Postgres novo.
 * Ainda assim o checksum precisa bater, senao `migrate status` acusa drift.
 *
 * O checksum anterior e impresso para rollback.
 *
 * Rodar: node scripts/alinhar-checksum.cjs 20260929090000_add_plans_subscriptions
 */
const { createHash } = require('node:crypto')
const { readFileSync } = require('node:fs')
const { PrismaClient } = require('@prisma/client')

const NOME = process.argv[2]
if (!NOME) {
  console.error('uso: node scripts/alinhar-checksum.cjs <nome-da-migration>')
  process.exit(1)
}
const ARQ = `prisma/migrations/${NOME}/migration.sql`
const sha = (buf) => createHash('sha256').update(buf).digest('hex')

const prisma = new PrismaClient()

;(async () => {
  const linhas = await prisma.$queryRawUnsafe(
    `SELECT checksum FROM _prisma_migrations
     WHERE migration_name = $1 AND rolled_back_at IS NULL AND finished_at IS NOT NULL`,
    NOME,
  )
  if (!linhas.length) {
    console.log(`migration ${NOME} nao esta aplicada no banco — nada a fazer.`)
    await prisma.$disconnect()
    return
  }
  const checksumAntigo = linhas[0].checksum
  const disco = sha(readFileSync(ARQ))

  console.log(`migration : ${NOME}`)
  console.log(`banco     : ${checksumAntigo}`)
  console.log(`disco     : ${disco}`)

  if (disco === checksumAntigo) {
    console.log('\nChecksums já coincidem — nenhum UPDATE necessário.')
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE _prisma_migrations SET checksum = $1
       WHERE migration_name = $2 AND rolled_back_at IS NULL`,
      disco,
      NOME,
    )
    console.log(`\nchecksum alinhado no banco: ${disco}`)
    console.log(`\nROLLBACK:\n  UPDATE _prisma_migrations SET checksum = '${checksumAntigo}'`)
    console.log(`   WHERE migration_name = '${NOME}';`)
  }

  const depois = await prisma.$queryRawUnsafe(
    `SELECT checksum FROM _prisma_migrations
     WHERE migration_name = $1 AND rolled_back_at IS NULL`,
    NOME,
  )
  console.log(
    `\nverificacao: ${
      sha(readFileSync(ARQ)) === depois[0].checksum ? 'IGUAIS' : 'DIVERGEM'
    }`,
  )
  await prisma.$disconnect()
})().catch(async (e) => {
  console.error('ERR', e.message)
  await prisma.$disconnect()
  process.exit(1)
})