/*
 * Descobre se basta remover o BOM da migration ou se o checksum no banco
 * também precisa ser corrigido.
 *
 * Prisma guarda em `_prisma_migrations.checksum` o sha256 do migration.sql.
 * Se o arquivo em disco hoje tem BOM mas o banco aplicou a versão sem BOM,
 * remover os 3 bytes realinha tudo e nenhum UPDATE no banco é necessário.
 *
 * Rodar: node scripts/verificar-checksums.cjs
 */
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { PrismaClient } = require("@prisma/client");

const dir = "prisma/migrations";
const prisma = new PrismaClient();
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

(async () => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, checksum, rolled_back_at FROM _prisma_migrations ORDER BY started_at`
  );

  console.log("migration".padEnd(42), "arquivo".padEnd(9), "banco".padEnd(9), "igual?");
  console.log("-".repeat(75));

  let divergentes = 0;
  for (const r of rows) {
    if (r.rolled_back_at) continue; // linha rolled-back não é validada no deploy
    const f = `${dir}/${r.migration_name}/migration.sql`;
    let disk;
    try {
      disk = sha(readFileSync(f));
    } catch {
      console.log(r.migration_name.padEnd(42), "AUSENTE NO DISCO");
      divergentes++;
      continue;
    }
    const same = disk === r.checksum;
    if (!same) divergentes++;
    console.log(
      r.migration_name.padEnd(42),
      disk.slice(0, 8).padEnd(9),
      (r.checksum ?? "").slice(0, 8).padEnd(9),
      same ? "sim" : "NAO"
    );
  }

  // Atenção: há mais de uma linha por migration quando houve rollback.
  // Só a linha ativa (rolled_back_at IS NULL) é a que o deploy valida.
  const alvo = rows.find((r) => r.migration_name === "20260918120000_sale_idempotency" && !r.rolled_back_at);
  if (alvo) {
    const buf = readFileSync(`${dir}/20260918120000_sale_idempotency/migration.sql`);
    const comBom = sha(buf);
    const semBom = sha(buf.subarray(3));
    console.log("\n=== 20260918120000_sale_idempotency ===");
    console.log("banco          :", alvo.checksum);
    console.log("arquivo c/ BOM :", comBom, comBom === alvo.checksum ? "<- bate" : "<- nao bate");
    console.log("arquivo s/ BOM :", semBom, semBom === alvo.checksum ? "<- BATE" : "<- nao bate");
    console.log(
      "\n=> " +
        (semBom === alvo.checksum
          ? "Basta remover o BOM. Nenhum UPDATE no banco."
          : "Vai exigir UPDATE do checksum no banco.")
    );
  }

  console.log(`\nMigrations divergentes: ${divergentes}`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
