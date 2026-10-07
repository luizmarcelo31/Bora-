/**
 * Setup script: cria um superadmin de teste no banco vazio.
 * Uso: node scripts/setup-superadmin.js
 * Precisa das vars E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD (no .env)
 */
const { createClient } = require("@supabase/supabase-js");

// Carrega .env via dotenv
require("dotenv").config({ path: ".env" });

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltam variáveis de ambiente: SUPABASE_SERVICE_ROLE_KEY, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD");
  process.exit(1);
}

// Conectar via service role key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wdstyefpdawtbggxlvzx.supabase.co";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log("=== Criando superadmin de teste ===");

  // 1. Criar o usuário via Supabase auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: {
      data: {
        provider: "email",
        confirmation_sent: false,
      },
    },
  });

  if (authError) {
    console.error("Erro ao criar usuário no Supabase:", authError.message);
  } else {
    console.log("Usuário criado no Supabase:", authData.user?.id);
  }

  // 2. Criar o registro no banco de dados (Prisma)
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Verificar se o tenant existe (recriar se necessário)
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log("Criando tenant de teste...");
      tenant = await prisma.tenant.create({
        data: {
          name: "BoraMais Test",
          type: "CONVENIENCE",
          status: "ACTIVE",
          planId: 1,
          trialDays: 14,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            create: {
              email: ADMIN_EMAIL,
              password: "Supabase admin (hash via service role)",
              role: "SUPER_ADMIN",
              active: true,
              name: "Super Admin Teste",
            },
          },
        },
      });
      console.log("Tenant criado:", tenant.id);
    }

    // Atualizar o usuário existente
    const dbUser = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: "SUPER_ADMIN", active: true },
      create: {
        email: ADMIN_EMAIL,
        password: "Supabase admin (hash via service role)",
        role: "SUPER_ADMIN",
        active: true,
        name: "Super Admin Teste",
        tenantId: tenant.id,
      },
    });

    console.log("Usuário no banco:", dbUser.id, "role:", dbUser.role);
  } catch (e) {
    console.error("Erro no banco:", e.message);
  }

  // 3. Verificar
  try {
    const check = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });
    console.log("Verificação:", check ? `OK - role: ${check.role}` : "FALHA");
    if (check) {
      console.log("  - active:", check.active, "| tenantId:", check.tenantId);
    }
  } catch (e) {
    console.error("Erro na verificação:", e.message);
  }

  await prisma.$disconnect();
  console.log("Setup concluído.");
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
