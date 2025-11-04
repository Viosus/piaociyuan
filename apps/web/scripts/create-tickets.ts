// scripts/create-tickets.ts
/**
 * 票初始化脚本
 *
 * 功能：为数据库中的每个票档生成对应数量的 Ticket 记录
 *
 * 使用方法：
 *   npx tsx scripts/create-tickets.ts
 *
 * 票号生成规则：
 *   格式: YYYY-EEEE-TT-SSSSSS
 *   - YYYY: 年份（如 2025）
 *   - EEEE: eventId（4位，前补0）
 *   - TT: tierId 后两位（如 101 -> 01）
 *   - SSSSSS: 序号（6位，前补0）
 *
 *   例如: 2025-0001-01-000001
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 生成票号
function generateTicketCode(eventId: number, tierId: number, sequence: number): string {
  const year = new Date().getFullYear();
  const eventPart = String(eventId).padStart(4, '0');
  const tierPart = String(tierId % 100).padStart(2, '0'); // 取后两位
  const seqPart = String(sequence).padStart(6, '0');

  return `${year}-${eventPart}-${tierPart}-${seqPart}`;
}

// 为单个票档创建票
async function createTicketsForTier(
  eventId: number,
  tierId: number,
  tierName: string,
  capacity: number,
  price: number
) {
  console.log(`\n📝 为票档 [${tierName}] 创建 ${capacity} 张票...`);

  const tickets = [];

  for (let i = 1; i <= capacity; i++) {
    const ticketCode = generateTicketCode(eventId, tierId, i);

    tickets.push({
      ticketCode,
      eventId,
      tierId,
      status: 'available', // 初始状态：可售
      price,
      userId: null,
      orderId: null,
      purchasedAt: null,
      usedAt: null,
      refundedAt: null,
    });
  }

  // 批量创建（每次 500 条，避免单次插入过多）
  const batchSize = 500;
  let created = 0;

  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    await prisma.ticket.createMany({
      data: batch,
      skipDuplicates: true, // 跳过重复的票号
    });
    created += batch.length;
    console.log(`   ✅ 已创建 ${created}/${capacity} 张`);
  }

  console.log(`✅ 票档 [${tierName}] 创建完成`);
}

// 主函数
async function main() {
  console.log('🎫 开始创建 Ticket 记录...\n');
  console.log('='.repeat(50));

  // 1. 获取所有活动和票档
  const events = await prisma.event.findMany({
    include: {
      tiers: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (events.length === 0) {
    console.log('❌ 数据库中没有活动数据');
    console.log('💡 请先运行: npm run db:seed');
    return;
  }

  console.log(`📊 找到 ${events.length} 个活动\n`);

  let totalTickets = 0;

  // 2. 为每个票档创建票
  for (const event of events) {
    console.log(`\n🎭 活动: ${event.name} (ID: ${event.id})`);
    console.log(`   城市: ${event.city}`);
    console.log(`   日期: ${event.date}`);
    console.log(`   票档数: ${event.tiers.length}`);

    for (const tier of event.tiers) {
      await createTicketsForTier(
        event.id,
        tier.id,
        tier.name,
        tier.capacity,
        tier.price
      );

      totalTickets += tier.capacity;
    }

    console.log(`\n✅ 活动 [${event.name}] 票创建完成`);
    console.log('-'.repeat(50));
  }

  // 3. 统计信息
  console.log('\n' + '='.repeat(50));
  console.log('📊 创建统计:');
  console.log(`   活动总数: ${events.length}`);
  console.log(`   票档总数: ${events.reduce((sum, e) => sum + e.tiers.length, 0)}`);
  console.log(`   票总数: ${totalTickets}`);

  // 4. 验证数据
  const ticketCount = await prisma.ticket.count();
  console.log(`\n✅ 数据库中实际票数: ${ticketCount}`);

  // 5. 按状态统计
  const statusStats = await prisma.ticket.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📈 按状态统计:');
  for (const stat of statusStats) {
    console.log(`   ${stat.status}: ${stat._count} 张`);
  }

  console.log('\n🎉 票创建完成！');
}

// 执行
main()
  .catch((e) => {
    console.error('❌ 创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
