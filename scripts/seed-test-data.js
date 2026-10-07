const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Verificar se já tem dados
  const tenantCount = await prisma.tenant.count();
  if (tenantCount > 0) {
    console.log('Banco já possui dados. Pulando seed.');
    return;
  }

  // Criar planos
  console.log('Criando planos...');
  const [planBasico, planPro] = await Promise.all([
    prisma.plan.create({
      data: { name: 'Básico', slug: 'basico', monthlyPrice: 4900, annualPrice: null, maxUsers: 2, maxProducts: 300, maxSalesPerMonth: 1000, trialDays: 14, active: true, featured: false, sortOrder: 0 },
    }),
    prisma.plan.create({
      data: { name: 'Pro', slug: 'pro', monthlyPrice: 9900, annualPrice: null, maxUsers: 5, maxProducts: 2000, maxSalesPerMonth: 1000, trialDays: 30, active: true, featured: true, sortOrder: 1 },
    }),
  ]);
  console.log('Planos criados:', planBasico.id, planPro.id);

  // Criar tenant (empresa)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'BoraMais Test',
      type: 'CONVENIENCE',
      email: 'investidor@test.com',
      phone: '11999999999',
    },
  });
  console.log('Tenant criado:', tenant.id);

  // Assinatura (com plano)
  const subscription = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planId: 1,
      status: 'EXPERIMENTACAO',
      billingCycle: 'MENSAL',
      startedAt: new Date(),
      renewsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Assinatura criada:', subscription.id);

  // Criar super admin
  const user = await prisma.user.create({
    data: {
      email: 'admin@bora.com',
      password: 'admin12345',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      active: true,
      tenantId: tenant.id,
    },
  });
  console.log('Usuário criado:', user.id);

  // Feature flags
  const flags = [
    { key: 'pdv-expresso-temporizador', description: 'Temporizador do PDV Expresso', enabled: true },
    { key: 'suporte-velocidad', description: 'Suporte mais rápido', enabled: true },
    { key: 'saude-expresso', description: 'Métrica de saúde do PDV', enabled: true },
  ];
  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: flag.key } },
      update: { ...flag },
      create: { ...flag, tenantId: tenant.id },
    });
  }
  console.log('Feature flags criadas');

  console.log('\nTudo pronto! Teste as funcionalidades:');
  console.log('  - /admin → verificar se o admin está logado');
  console.log('  - /admin/features → testar toggles de flags');
  console.log('  - /admin/planos → ver planos e limites');
  console.log('  - /admin/empresas → ver empresas');
  console.log('  - /admin/usuarios → ver usuários');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
