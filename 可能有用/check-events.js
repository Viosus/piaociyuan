/**
 * 原始位置：C:\piaoyuzhou\check-events.js
 * 用途：调试脚本 - 查询数据库中的所有活动（Event）记录
 * 功能：连接数据库并列出所有活动的 ID、名称和日期
 * 使用方法：node check-events.js
 */

process.env.DATABASE_URL = 'file:C:/piaoyuzhou/prisma/dev.db';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany();
  console.log('数据库中的活动数量:', events.length);
  console.log('活动列表:');
  events.forEach(e => {
    console.log(`  ID: ${e.id}, 名称: ${e.name}, 日期: ${e.date}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());