require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'admin@bora.com';
  const password = 'admin12345';
  const name = 'Super Admin';

  // Verificar se o usuário já existe
  const { data: existing } = await supabase.auth.admin.listUsers();
  const userExists = existing?.users?.find(u => u.email === email);
  if (userExists) {
    console.log('Usuário já existe:', userExists.id);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) {
      console.error('Erro ao criar usuário no Supabase:', error.message);
    } else {
      console.log('Usuário criado no Supabase:', data.user.id);
    }
  }

  // Verificar a base de dados
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, tenant: true },
  });
  console.log('Usuário no banco:', dbUser ? { id: dbUser.id, role: dbUser.role, tenantId: dbUser.tenantId } : null);

  // Verificar feature flags
  const { count } = await prisma.featureFlag.count({ where: { tenantId: dbUser?.tenantId } });
  console.log('Feature flags:', count);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
