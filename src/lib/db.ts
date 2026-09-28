import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });

// Reuso global sempre: no serverless cada novo client abre novas conexões
// e derruba o pool (500 intermitente no primeiro BEGIN).
globalForPrisma.prisma = prisma;
