// Confere se as 7 tabelas sem migration versionada existem no Postgres,
// e se as colunas do schema batem com o que está no banco.
// Não imprime nada do .env. Uso: node scripts/listar-tabelas.mjs
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

const prisma = new PrismaClient()

const tabelas = [
  'Promotion', 'PromotionItem', 'Supplier', 'Purchase', 'PurchaseItem',
  'InventoryCount', 'InventoryCountItem',
]

// nomes de campo (não relação) declarados no schema para cada modelo
const schema = readFileSync('prisma/schema.prisma', 'utf8')

function camposDoSchema(model) {
  const bloco = schema.split(new RegExp(`^model ${model} \\{`, 'm'))[1]
  if (!bloco) return null
  const corpo = bloco.split('\n}')[0]
  const campos = []
  for (const linha of corpo.split('\n')) {
    const m = linha.match(/^\s{2}(\w+)\s+\w/)
    if (m) campos.push(m[1])
  }
  return campos
}

try {
  const tabs = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name;`)
  const existentes = new Set(tabs.map((r) => r.table_name))
  console.log(`Tabelas em public: ${existentes.size}`)

  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' ORDER BY table_name, ordinal_position;`)
  const porTabela = new Map()
  for (const c of cols) {
    if (!porTabela.has(c.table_name)) porTabela.set(c.table_name, new Set())
    porTabela.get(c.table_name).add(c.column_name)
  }

  console.log('\nmodelo                 banco  col_banco  faltando_no_banco')
  console.log('-'.repeat(72))
  let problemas = 0
  for (const t of tabelas) {
    const doBanco = porTabela.get(t)
    if (!doBanco) {
      console.log(`${t.padEnd(22)} AUSENTE`)
      problemas++
      continue
    }
    const esperado = camposDoSchema(t) ?? []
    const faltando = esperado.filter((c) => !doBanco.has(c))
    if (faltando.length) problemas++
    console.log(
      `${t.padEnd(22)} sim    ${String(doBanco.size).padEnd(10)} ` +
        (faltando.length ? faltando.join(', ') : '(nenhuma)'),
    )
  }
  console.log(`\nDivergencias: ${problemas}`)
} finally {
  await prisma.$disconnect()
}