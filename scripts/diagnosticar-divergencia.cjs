/*
 * Por que 5 migrations divergem do checksum guardado no banco?
 *
 * Hipótese: checkout no Windows convertendo LF<->CRLF altera os bytes do
 * migration.sql e muda o sha256, mesmo sem alteração de conteúdo.
 * Se normalizando CRLF->LF o checksum bater, a divergência é do git, não
 * de edição — e a correção é configurar o .gitattributes, não mexer no banco.
 */
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { PrismaClient } = require("@prisma/client");

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const soLf = (buf) => Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
const semBom = (buf) => (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? buf.subarray(3) : buf);

const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, checksum, rolled_back_at FROM _prisma_migrations
     WHERE rolled_back_at IS NULL ORDER BY started_at`
  );

  for (const r of rows) {
    let buf;
    try {
      buf = readFileSync(`prisma/migrations/${r.migration_name}/migration.sql`);
    } catch {
      console.log(`${r.migration_name}\n  AUSENTE NO DISCO\n`);
      continue;
    }

    const crlf = (buf.toString("utf8").match(/\r\n/g) || []).length;
    const variantes = {
      "como está": sha(buf),
      "CRLF->LF": sha(soLf(buf)),
      "sem BOM": sha(semBom(buf)),
      "sem BOM + CRLF->LF": sha(soLf(semBom(buf))),
    };

    const bate = Object.entries(variantes).find(([, v]) => v === r.checksum);
    console.log(`${r.migration_name}`);
    console.log(`  banco: ${r.checksum.slice(0, 16)}...   CRLF no arquivo: ${crlf}`);
    if (bate) console.log(`  ==> BATEMA COM: ${bate[0]}`);
    else {
      for (const [k, v] of Object.entries(variantes)) {
        console.log(`      ${k.padEnd(20)} ${v.slice(0, 16)}...`);
      }
    }
    console.log("");
  }

  // Configuração que pode estar causando a conversão
  const { execSync } = require("node:child_process");
  const autocrlf = execSync("git config --get core.autocrlf || echo '(nao definido)'")
    .toString()
    .trim();
  const attrs = (() => {
    try {
      return execSync("git check-attr text eol -- prisma/migrations/20260917125414_init/migration.sql")
        .toString()
        .trim();
    } catch {
      return "(sem .gitattributes)";
    }
  })();
  console.log(`core.autocrlf: ${autocrlf}`);
  console.log(`gitattributes: ${attrs}`);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("ERR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
