/*
 * Correção cirúrgica da migration 20260918120000_sale_idempotency.
 *
 * Dois defeitos no mesmo arquivo:
 *   1. BOM UTF-8 no início -> o Postgres lê BOM como lixo e o replay da
 *      migration no shadow database falha com "syntax error at or near BOM".
 *      É o motivo de `npx prisma migrate dev` estar quebrado no repo.
 *   2. O checksum gravado no banco é da versão com CRLF (checkout do Windows
 *      com core.autocrlf=true). Com .gitattributes nova, a forma canônica é
 *      LF, então o banco precisa registrar o checksum dessa forma.
 *
 * A mudança é apenas de bytes invisíveis (BOM + fim de linha); o SQL
 * executado é idêntico. O checksum anterior fica impresso para rollback.
 *
 * Rodar: node scripts/corrigir-migration-bom.cjs
 */
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const { PrismaClient } = require("@prisma/client");

const NOME = "20260918120000_sale_idempotency";
const ARQ = `prisma/migrations/${NOME}/migration.sql`;
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const prisma = new PrismaClient();

(async () => {
  const original = readFileSync(ARQ);
  const linha = await prisma.$queryRawUnsafe(
    `SELECT checksum FROM _prisma_migrations WHERE migration_name = $1 AND rolled_back_at IS NULL`,
    NOME
  );
  const checksumAntigo = linha[0].checksum;
  console.log(`migration: ${NOME}`);
  console.log(`checksum no banco (antes): ${checksumAntigo}`);

  // --- 1. Remove BOM e normaliza para LF ---
  let corpo = original;
  const tinhaBom = corpo[0] === 0xef && corpo[1] === 0xbb && corpo[2] === 0xbf;
  if (tinhaBom) corpo = corpo.subarray(3);
  const limpo = Buffer.from(corpo.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  writeFileSync(ARQ, limpo);
  console.log(`BOM removido: ${tinhaBom ? "sim" : "ja nao tinha"} | bytes: ${original.length} -> ${limpo.length}`);

  // --- 2. Alinha o checksum no banco ---
  const novo = sha(limpo);
  if (novo === checksumAntigo) {
    console.log("Checksum ja bate — nenhum UPDATE necessario.");
  } else {
    const affected = await prisma.$executeRawUnsafe(
      `UPDATE _prisma_migrations SET checksum = $1 WHERE migration_name = $2 AND rolled_back_at IS NULL`,
      novo,
      NOME
    );
    console.log(`checksum no banco (depois): ${novo}  (${affected} linha(s) atualizada)`);
    console.log(`\nROLLBACK: UPDATE _prisma_migrations SET checksum = '${checksumAntigo}'`);
    console.log(`          WHERE migration_name = '${NOME}';`);
  }

  // --- 3. Confere ---
  const depois = await prisma.$queryRawUnsafe(
    `SELECT checksum FROM _prisma_migrations WHERE migration_name = $1 AND rolled_back_at IS NULL`,
    NOME
  );
  const disco = sha(readFileSync(ARQ));
  console.log(`\nverificacao: disco=${disco.slice(0, 16)} banco=${depois[0].checksum.slice(0, 16)} -> ${disco === depois[0].checksum ? "IGUAIS" : "DIVERGEM"}`);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
