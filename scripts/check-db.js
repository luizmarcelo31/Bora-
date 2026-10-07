const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', JSON.stringify(tenants, null, 2));
  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users, null, 2));
  const flags = await prisma.featureFlag.findMany({ select: { key: true, descricao: true, enabled: true } });
  console.log('Feature flags:', JSON.stringify(flags, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
