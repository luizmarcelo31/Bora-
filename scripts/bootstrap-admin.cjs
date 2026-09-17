/**
 * Bootstrap do primeiro SUPER_ADMIN da plataforma.
 *
 * Uso:
 *   node scripts/bootstrap-admin.cjs "admin@boramais.com" "Admin"
 *
 * - Cria o tenant "BoraMais Plataforma" (type PLATFORM) se não existir.
 * - Cria (ou promove a SUPER_ADMIN) o usuário com o email informado.
 * - O email precisa ser o mesmo do cadastro no /signup (Supabase Auth).
 */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || "Admin";

  if (!email || !email.includes("@")) {
    console.error('Uso: node scripts/bootstrap-admin.cjs "email@dominio.com" "Nome"');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    let platform = await prisma.tenant.findFirst({
      where: { type: "PLATFORM" },
    });

    if (!platform) {
      platform = await prisma.tenant.create({
        data: { name: "BoraMais Plataforma", type: "PLATFORM" },
      });
      console.log("Tenant plataforma criado: id=" + platform.id);
    } else {
      console.log("Tenant plataforma existente: id=" + platform.id);
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "SUPER_ADMIN", tenantId: platform.id, active: true, name },
      create: { email, name, role: "SUPER_ADMIN", tenantId: platform.id },
    });

    console.log("SUPER_ADMIN pronto: id=" + user.id + " email=" + user.email);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("BOOTSTRAP_ERROR " + String((e && e.message) || e).substring(0, 300));
  process.exit(1);
});
