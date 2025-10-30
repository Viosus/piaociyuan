// lib/prisma.ts
/**
 * Prisma Client 单例
 *
 * 在开发环境中，由于热重载会创建多个 Prisma Client 实例
 * 使用全局变量确保只有一个实例
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
