// lib/prisma.ts
/**
 * Prisma Client 单例（支持高并发优化）
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
  // 🔥 高并发优化：连接池配置
  // PostgreSQL 默认最大连接数约 100，建议设置为 10-20
  // 如需更高并发，需在 .env 的 DATABASE_URL 中配置 connection_limit
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
