// Teste fim a fim: cria uma empresa pelo formulário e confere o banco.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const SENHA = process.env.E2E_ADMIN_PASSWORD;
const BASE = 'http://localhost:3000';
const prisma = new PrismaClient();

const NOME = 'Conveniência Teste E2E';

(async () => {
  // limpa rastro anterior
  const anterior = await prisma.tenant.findFirst({ where: { name: NOME } });
  if (anterior) await prisma.tenant.delete({ where: { id: anterior.id } });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', SENHA);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });

  await page.goto(`${BASE}/admin/empresas/nova`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('main');
  // O Radix so responde depois da hidratacao. Sem esta espera o primeiro
  // clique no seletor acontece antes e nao abre nada — o teste falha por
  // motivo errado (timeout em [role=option]).
  await page.waitForTimeout(2000);

  await page.fill('input[name="name"]', NOME);

  // segmento: escolhe RESTAURANT (o segundo da lista) para provar que não está
  // travado em CONVENIENCE.
  // `waitFor` antes do click no item: o Radix abre o portal num tick depois
  // do clique, e sem a espera o locator procura um elemento que ainda nao existe.
  const comboSegmento = page.locator('[role="combobox"]').first();
  await comboSegmento.click();
  await page.locator('[role="option"]').first().waitFor({ timeout: 10000 });
  await page.locator('[role="option"]', { hasText: 'Restaurante' }).click();

  // plano: o Pro (30 dias de teste).
  // Seleciona por `data-value`, não por texto: o rótulo carrega preço e três
  // limites e muda junto com o plano, então casar por texto é frágil.
  await page.locator('[role="combobox"]').nth(1).click();
  await page.locator('[role="option"]').first().waitFor({ timeout: 10000 });
  // Radix nao expoe data-value no option. Casa pelo inicio do rotulo, que
  // comeca pelo nome do plano — 'Pro' nao colide com 'Basico'.
  await page.locator('[role="option"]').filter({ hasText: /^Pro ·/ }).first().click();

  // trial curto para diferenciar do padrao de 14 dias do plano
  await page.fill('input[name="trialDays"]', '5');
  await page.fill('input[name="email"]', 'teste@empresa.com');

  const antes = await page.evaluate(() => ({
    segmento: document.querySelector('input[name="type"]')?.value,
    plano: document.querySelector('input[name="planId"]')?.value,
    trial: document.querySelector('input[name="trialDays"]')?.value,
  }));
  console.log('valores no form:', JSON.stringify(antes));

  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/empresas*', { timeout: 30000 });
  console.log('redirecionou para:', page.url());

  const empresa = await prisma.tenant.findFirst({
    where: { name: NOME },
    include: { subscription: { include: { plan: true } } },
  });

  if (!empresa) {
    console.error('FALHOU: empresa não foi criada');
    await browser.close();
    await prisma.$disconnect();
    process.exit(1);
  }

  const dias = empresa.trialEndsAt
    ? Math.round((empresa.trialEndsAt - new Date()) / 86400000)
    : null;

  console.log('\n=== no banco ===');
  console.log('empresa.id      ', empresa.id);
  console.log('empresa.name    ', empresa.name);
  console.log('empresa.type    ', empresa.type);
  console.log('empresa.status  ', empresa.status);
  console.log('trialEndsAt     ', dias === null ? 'null' : `em ${dias} dias`);
  console.log('assinatura      ', empresa.subscription ? 'criada' : 'AUSENTE ← BUG');
  console.log('plano           ', empresa.subscription?.plan.name);
  console.log('assin.status    ', empresa.subscription?.status);
  console.log('renova em       ', empresa.subscription?.renewsAt.toISOString().slice(0, 10));

  const ok =
    empresa.type === 'RESTAURANT' &&
    empresa.status === 'TRIAL' &&
    empresa.subscription !== null &&
    empresa.subscription.plan.name === 'Pro' &&
    empresa.subscription.status === 'EXPERIMENTACAO';

  console.log('\nresultado:', ok ? '✅ tudo como esperado' : '❌ divergente');

  // limpeza
  await prisma.tenant.delete({ where: { id: empresa.id } });
  await browser.close();
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})();