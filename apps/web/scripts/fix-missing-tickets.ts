// scripts/fix-missing-tickets.ts
/**
 * 修复缺失票务数据的脚本
 *
 * 功能：
 * 1. 为没有票档 (Tier) 的活动添加默认票档
 * 2. 为没有票 (Ticket) 的票档创建票记录
 *
 * 使用方法：
 *   npx tsx scripts/fix-missing-tickets.ts
 *
 * 环境变量：
 *   DATABASE_URL - 数据库连接字符串
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 生成票号
function generateTicketCode(eventId: number, tierId: number, sequence: number): string {
  const year = new Date().getFullYear();
  const eventPart = String(eventId).padStart(4, '0');
  const tierPart = String(tierId % 100).padStart(2, '0');
  const seqPart = String(sequence).padStart(6, '0');
  return `${year}-${eventPart}-${tierPart}-${seqPart}`;
}

// 默认票档配置（根据活动类别）
const DEFAULT_TIERS: Record<string, Array<{ name: string; price: number; capacity: number }>> = {
  concert: [
    { name: 'VIP内场', price: 1280, capacity: 200 },
    { name: 'A区看台', price: 680, capacity: 500 },
    { name: 'B区看台', price: 380, capacity: 800 },
  ],
  festival: [
    { name: '三日通票', price: 580, capacity: 1000 },
    { name: '单日票', price: 260, capacity: 2000 },
    { name: '学生票', price: 160, capacity: 500 },
  ],
  exhibition: [
    { name: '成人票', price: 128, capacity: 300 },
    { name: '学生票', price: 68, capacity: 200 },
    { name: '双人票', price: 218, capacity: 150 },
  ],
  musicale: [
    { name: 'VIP座', price: 880, capacity: 100 },
    { name: '甲票', price: 580, capacity: 200 },
    { name: '乙票', price: 380, capacity: 300 },
  ],
  show: [
    { name: 'VIP座', price: 480, capacity: 80 },
    { name: '甲票', price: 280, capacity: 150 },
    { name: '乙票', price: 180, capacity: 200 },
  ],
  sports: [
    { name: 'VIP场边', price: 980, capacity: 50 },
    { name: '内场座位', price: 480, capacity: 300 },
    { name: '看台座位', price: 180, capacity: 600 },
  ],
  other: [
    { name: '普通票', price: 198, capacity: 200 },
    { name: '优惠票', price: 128, capacity: 100 },
  ],
};

// 为票档创建票
async function createTicketsForTier(
  eventId: number,
  tierId: number,
  capacity: number,
  price: number
) {
  // 检查是否已有票
  const existingCount = await prisma.ticket.count({
    where: { eventId, tierId },
  });

  if (existingCount >= capacity) {
    console.log(`   ⏭️ 票档 ID ${tierId} 已有 ${existingCount} 张票，跳过`);
    return 0;
  }

  const toCreate = capacity - existingCount;
  const tickets = [];

  for (let i = existingCount + 1; i <= capacity; i++) {
    tickets.push({
      ticketCode: generateTicketCode(eventId, tierId, i),
      eventId,
      tierId,
      status: 'available',
      price,
    });
  }

  // 批量创建
  const batchSize = 500;
  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    await prisma.ticket.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ 为票档 ID ${tierId} 创建了 ${toCreate} 张票`);
  return toCreate;
}

async function main() {
  console.log('🔧 开始修复缺失的票务数据...\n');
  console.log('='.repeat(60));

  let tiersCreated = 0;
  let ticketsCreated = 0;

  // 1. 获取所有活动
  const events = await prisma.event.findMany({
    include: {
      tiers: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`📊 找到 ${events.length} 个活动\n`);

  for (const event of events) {
    console.log(`\n🎭 活动: ${event.name} (ID: ${event.id})`);
    console.log(`   类别: ${event.category}`);
    console.log(`   现有票档: ${event.tiers.length}`);

    // 2. 如果没有票档，创建默认票档
    if (event.tiers.length === 0) {
      console.log(`   ⚠️ 没有票档，正在创建默认票档...`);

      const defaultTiers = DEFAULT_TIERS[event.category] || DEFAULT_TIERS.other;

      for (const tierDef of defaultTiers) {
        const tier = await prisma.tier.create({
          data: {
            eventId: event.id,
            name: tierDef.name,
            price: tierDef.price,
            capacity: tierDef.capacity,
            remaining: tierDef.capacity,
            sold: 0,
          },
        });

        console.log(`   ✅ 创建票档: ${tier.name} (¥${tier.price}, ${tier.capacity}张)`);
        tiersCreated++;

        // 为新创建的票档创建票
        const created = await createTicketsForTier(
          event.id,
          tier.id,
          tier.capacity,
          tier.price
        );
        ticketsCreated += created;
      }
    } else {
      // 3. 检查现有票档是否有票
      for (const tier of event.tiers) {
        const ticketCount = await prisma.ticket.count({
          where: { eventId: event.id, tierId: tier.id },
        });

        console.log(`   票档: ${tier.name} - 现有票数: ${ticketCount}/${tier.capacity}`);

        if (ticketCount < tier.capacity) {
          const created = await createTicketsForTier(
            event.id,
            tier.id,
            tier.capacity,
            tier.price
          );
          ticketsCreated += created;
        }
      }
    }
  }

  // 4. 更新票档的 remaining 字段（根据实际可用票数）
  console.log('\n\n📊 更新票档剩余数量...');

  const tiers = await prisma.tier.findMany();
  for (const tier of tiers) {
    const availableCount = await prisma.ticket.count({
      where: {
        eventId: tier.eventId,
        tierId: tier.id,
        status: 'available',
      },
    });

    const soldCount = await prisma.ticket.count({
      where: {
        eventId: tier.eventId,
        tierId: tier.id,
        status: { in: ['sold', 'used'] },
      },
    });

    await prisma.tier.update({
      where: { id: tier.id },
      data: {
        remaining: availableCount,
        sold: soldCount,
      },
    });
  }

  // 5. 统计结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 修复结果:');
  console.log(`   新创建票档: ${tiersCreated}`);
  console.log(`   新创建票: ${ticketsCreated}`);

  const totalTiers = await prisma.tier.count();
  const totalTickets = await prisma.ticket.count();
  const availableTickets = await prisma.ticket.count({ where: { status: 'available' } });

  console.log('\n📈 数据库总计:');
  console.log(`   活动总数: ${events.length}`);
  console.log(`   票档总数: ${totalTiers}`);
  console.log(`   票总数: ${totalTickets}`);
  console.log(`   可售票数: ${availableTickets}`);

  console.log('\n🎉 修复完成！');
}

main()
  .catch((e) => {
    console.error('❌ 修复失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
