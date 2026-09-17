# 🚀 SETUP PRÁTICO: COMECE AGORA!

## Tempo estimado: 30 minutos até ter banco funcionando

---

## PASSO 1: Criar projeto Next.js

```bash
# Crie a pasta do projeto
mkdir saas-conveniencia
cd saas-conveniencia

# Initialize Next.js com o setup interativo
npx create-next-app@latest . --typescript --tailwind --eslint

# Quando perguntar, responda:
✓ TypeScript? → Yes
✓ ESLint? → Yes
✓ Tailwind CSS? → Yes
✓ src/ directory? → Yes
✓ App Router? → Yes
✓ import alias? → Yes
```

**Resultado: Projeto pronto em 2 minutos**

---

## PASSO 2: Instalar dependências principais

```bash
# ORM
npm install @prisma/client
npm install -D prisma

# Auth
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs

# Validação
npm install zod

# UI (shadcn/ui)
npx shadcn-ui@latest init

# Quando perguntar:
✓ Would you like to use TypeScript? → Yes
✓ Which style would you like to use? → New York
✓ Which color would you like as primary? → Slate
✓ Where is your global CSS file? → src/app/globals.css

# Ícones
npm install lucide-react

# Variables de ambiente
npm install dotenv
```

---

## PASSO 3: Configurar Supabase

### 3.1 Criar conta no Supabase
```
1. Vá para https://supabase.com
2. Clique em "Start your project"
3. Use GitHub ou Google para criar conta
4. Crie um novo projeto
   - Name: "saas-conveniencia"
   - Password: (salve em lugar seguro)
   - Region: (escolha mais perto de você)
```

### 3.2 Pegar credenciais
```
1. Vá em Settings → API
2. Copie:
   - Project URL
   - anon public key
3. Salve em .env.local
```

### 3.3 Criar .env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# Banco (Prisma)
DATABASE_URL=postgresql://postgres:sua_senha@seu_host:5432/postgres
# Ou direto do Supabase:
# DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SUAREGIAO.supabase.co:5432/postgres
```

**Como pegar DATABASE_URL do Supabase:**
```
Settings → Database → Connection string
Copie a string: postgresql://postgres:password@...
```

---

## PASSO 4: Inicializar Prisma

```bash
# Setup Prisma
npx prisma init

# Resultado: Criou prisma/schema.prisma
```

---

## PASSO 5: Criar Schema do Banco

**Edite `prisma/schema.prisma`:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== CORE: Multi-tenant =====

model Tenant {
  id        Int     @id @default(autoincrement())
  name      String
  type      String  @default("CONVENIENCE")  // CONVENIENCE, RESTAURANT, etc
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relacionamentos
  users     User[]
  products  Product[]
  inventory Inventory[]
  
  @@index([active])
}

// ===== CORE: Usuários =====

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  password  String? // Se usar supabase auth, não precisa
  role      Role    @default(STAFF)
  tenantId  Int
  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, email])
  @@index([tenantId])
}

enum Role {
  OWNER
  MANAGER
  FINANCIAL
  STOCK
  CASHIER
}

// ===== CORE: Produtos =====

model Product {
  id        Int     @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name      String
  sku       String?
  price     Int     // em centavos: 1000 = R$ 10.00
  cost      Int?
  category  String?
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  inventory Inventory?
  
  @@unique([tenantId, sku])
  @@index([tenantId])
}

// ===== CORE: Estoque =====

model Inventory {
  id        Int     @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  productId Int     @unique
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int     @default(0)
  updatedAt DateTime @updatedAt
  
  movements StockMovement[]
  
  @@index([tenantId])
}

model StockMovement {
  id          Int     @id @default(autoincrement())
  inventoryId Int
  inventory   Inventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  type        String  // ENTRADA, SAIDA, AJUSTE, VENDA
  quantity    Int
  reason      String?
  createdAt   DateTime @default(now())
  
  @@index([inventoryId])
}

// ===== Adicione conforme precisar =====
// - Sales (Vendas do PDV)
// - Finance (Movimentações financeiras)
// - etc
```

---

## PASSO 6: Primeira Migration

```bash
# Criar e executar migration
npx prisma migrate dev --name init

# Quando perguntar se quer gerar Prisma Client: yes
```

**O que aconteceu:**
- ✅ Banco foi criado no Supabase
- ✅ Tabelas foram criadas
- ✅ Tipos TypeScript foram gerados
- ✅ Arquivo migration criado

Verifique em Supabase → SQL Editor, deve ver as tabelas criadas.

---

## PASSO 7: Criar lib/db.ts

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;
```

---

## PASSO 8: Criar validators com Zod

```typescript
// src/lib/validators.ts
import { z } from 'zod';

// ===== Tenant =====
export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  type: z.enum(['CONVENIENCE', 'RESTAURANT', 'RETAIL']).default('CONVENIENCE'),
});

export const updateTenantSchema = createTenantSchema.partial();

// ===== Product =====
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  sku: z.string().optional(),
  price: z.number().int().positive('Price must be positive'),
  cost: z.number().int().optional(),
  category: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ===== User =====
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['OWNER', 'MANAGER', 'FINANCIAL', 'STOCK', 'CASHIER']),
});

// ===== Stock Movement =====
export const createStockMovementSchema = z.object({
  productId: z.number().int().positive(),
  type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'VENDA']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});

// Types para seu frontend
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

---

## PASSO 9: Criar primeira Service

```typescript
// src/services/product.service.ts
import { prisma } from '@/lib/db';
import { createProductSchema, updateProductSchema } from '@/lib/validators';
import { z } from 'zod';

export class ProductService {
  /**
   * Lista produtos do tenant
   */
  static async listProducts(tenantId: number) {
    return prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        inventory: true,
      },
    });
  }

  /**
   * Cria novo produto
   */
  static async createProduct(
    tenantId: number,
    data: z.infer<typeof createProductSchema>
  ) {
    // 1. Validar entrada
    const validated = createProductSchema.parse(data);

    // 2. Verificar tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error('Tenant not found');

    // 3. Verificar SKU duplicado
    if (validated.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: validated.sku,
        },
      });

      if (existing) throw new Error('Product with this SKU already exists');
    }

    // 4. Criar produto + estoque na mesma transação
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId,
          ...validated,
        },
      });

      // Criar registro de estoque
      await tx.inventory.create({
        data: {
          tenantId,
          productId: p.id,
          quantity: 0,
        },
      });

      return p;
    });

    return product;
  }

  /**
   * Atualiza produto
   */
  static async updateProduct(
    tenantId: number,
    productId: number,
    data: z.infer<typeof updateProductSchema>
  ) {
    const validated = updateProductSchema.parse(data);

    // Verificar que produto pertence ao tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) throw new Error('Product not found');

    return prisma.product.update({
      where: { id: productId },
      data: validated,
    });
  }

  /**
   * Deleta produto
   */
  static async deleteProduct(tenantId: number, productId: number) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
    });

    if (!product) throw new Error('Product not found');

    return prisma.product.delete({
      where: { id: productId },
    });
  }
}
```

---

## PASSO 10: Criar primeira API Route

```typescript
// src/app/api/products/route.ts
import { ProductService } from '@/services/product.service';
import { createProductSchema } from '@/lib/validators';
import { NextRequest, NextResponse } from 'next/server';

// GET: Listar produtos
export async function GET(req: NextRequest) {
  try {
    // Pegar tenantId da requisição
    // (você vai ajustar isso conforme implementar auth)
    const tenantId = 1; // Por enquanto hardcoded

    const products = await ProductService.listProducts(tenantId);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST: Criar produto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = 1; // Você vai pegar isso de auth depois

    const product = await ProductService.createProduct(tenantId, body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
```

---

## PASSO 11: Testar com Postman/Insomnia

```bash
# 1. Inicie servidor
npm run dev

# 2. Faça requisição GET
GET http://localhost:3000/api/products

# Resposta:
[]

# 3. Faça requisição POST
POST http://localhost:3000/api/products

Body JSON:
{
  "name": "Coca-Cola 2L",
  "sku": "COCA2L",
  "price": 1299,
  "cost": 600,
  "category": "Bebidas"
}

# Resposta:
{
  "id": 1,
  "tenantId": 1,
  "name": "Coca-Cola 2L",
  "sku": "COCA2L",
  "price": 1299,
  "cost": 600,
  "category": "Bebidas",
  "active": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## PRÓXIMOS PASSOS (Semana 1-2)

```
[ ] Configurar Supabase Auth
[ ] Criar middleware de autenticação
[ ] Configurar contexto de tenant
[ ] Criar primeiros componentes UI
[ ] Implementar roles e permissões básicas
[ ] Criar Super Admin dashboard simples
```

---

## 📚 Estrutura de pasta AGORA

```
src/
├── app/
│   ├── api/
│   │   └── products/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   └── ui/  # shadcn/ui components aqui
│
├── lib/
│   ├── db.ts
│   ├── validators.ts
│   └── utils.ts
│
├── services/
│   └── product.service.ts
│
└── prisma/
    ├── schema.prisma
    └── migrations/
        └── 20240115_init/migration.sql

.env.local
```

---

## ✅ Checklist: Primeira sessão

```
[ ] Next.js criado
[ ] shadcn/ui instalado
[ ] Supabase conta criada
[ ] Prisma instalado
[ ] schema.prisma criado
[ ] Migration rodou
[ ] API route funcionando
[ ] Conseguiu POST/GET
```

Se tudo deu certo, você tem:
- ✅ Backend funcionando
- ✅ Banco de dados
- ✅ Validação
- ✅ Services de negócio
- ✅ API Routes

**Próximo: Implementar Auth no Supabase** (outra sessão)

---

## 🆘 Troubleshooting

### Problema: "Error: P1000: Authentication failed"
```
Solução: Verifique DATABASE_URL no .env.local
Copie exatamente de: Supabase → Settings → Database
```

### Problema: "No provider found for .env.local"
```
Solução: Verifique se DATABASE_URL começa com postgresql://
```

### Problema: "The introspected database was empty"
```
Solução: Migration não rodou. Execute:
npx prisma migrate dev --name init
```

---

## 🎉 Parabéns!

Você tem um SaaS com:
- Banco de dados pronto
- ORM configurado
- Validação com Zod
- Estrutura de services
- API routes funcionando

**Próximo: Implementar autenticação e multi-tenancy.**

Quer um guia para a próxima etapa?
