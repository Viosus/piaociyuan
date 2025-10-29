process.env.DATABASE_URL = 'file:C:/piaoyuzhou/prisma/dev.db';const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('查询最近 10 个订单的创建时间:\n');
  
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      status: true,
    },
  });
  
  orders.forEach(order => {
    const timestamp = Number(order.createdAt);
    const date = new Date(timestamp);
    console.log(`订单: ${order.id}`);
    console.log(`  createdAt (数字): ${timestamp}`);
    console.log(`  转换为日期: ${date.toLocaleString('zh-CN')}`);
    console.log(`  ISO格式: ${date.toISOString()}`);
    console.log(`  状态: ${order.status}`);
    console.log('');
  });
  
  console.log('总订单数:', orders.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());