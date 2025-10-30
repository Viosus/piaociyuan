/**
 * 原始位置：C:\piaoyuzhou\prisma.config.ts
 * 用途：Prisma 配置文件（可能不需要）
 * 功能：定义 Prisma 的配置选项
 * 说明：现代 Prisma 项目通常不需要此文件，配置都在 schema.prisma 中
 */

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
