// scripts/seed-badges.ts
/**
 * 创建数字纪念品种子数据
 *
 * 为每个活动创建纪念品：
 * - 活动纪念徽章（活动级别）
 * - 票根纪念品（票档级别）
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 开始创建纪念品数据...\n');

  // 获取所有活动
  const events = await prisma.event.findMany({
    include: {
      tiers: true,
    },
  });

  console.log(`📋 找到 ${events.length} 个活动\n`);

  for (const event of events) {
    console.log(`\n🎪 处理活动: ${event.name}`);

    // 1️⃣ 为活动创建一个纪念徽章（活动级别，稀有）
    const eventBadge = await prisma.badge.create({
      data: {
        eventId: event.id,
        tierId: null, // 活动级别
        name: `${event.name} - 参与纪念`,
        description: `恭喜你参加了 ${event.name}！这是一枚珍贵的活动纪念徽章，记录你在 ${event.city} ${event.venue} 的美好回忆。`,
        imageUrl: `/badges/event-${event.id}-badge.png`,
        rarity: 'rare', // 稀有
        type: 'badge',
        isActive: true,
      },
    });
    console.log(`  ✅ 创建活动徽章: ${eventBadge.name}`);

    // 2️⃣ 为每个票档创建票根纪念品（票档级别，普通）
    for (const tier of event.tiers) {
      const ticketStub = await prisma.badge.create({
        data: {
          eventId: event.id,
          tierId: tier.id,
          name: `${event.name} - ${tier.name} 票根`,
          description: `${event.name} 的 ${tier.name} 电子票根。日期: ${event.date} ${event.time}，地点: ${event.city} ${event.venue}。`,
          imageUrl: `/badges/event-${event.id}-tier-${tier.id}-ticket.png`,
          rarity: 'common', // 普通
          type: 'ticket_stub',
          isActive: true,
        },
      });
      console.log(`  ✅ 创建票根: ${ticketStub.name}`);

      // 3️⃣ VIP票档额外创建一个海报纪念品（传说级）
      if (tier.name.includes('VIP') || tier.name.includes('内场')) {
        const poster = await prisma.badge.create({
          data: {
            eventId: event.id,
            tierId: tier.id,
            name: `${event.name} - 限量海报`,
            description: `${event.name} 的限量版数字海报，仅 ${tier.name} 持有者专享！由 ${event.artist} 亲笔签名设计。`,
            imageUrl: `/badges/event-${event.id}-tier-${tier.id}-poster.png`,
            rarity: 'legendary', // 传说
            type: 'poster',
            isActive: true,
          },
        });
        console.log(`  🌟 创建限量海报: ${poster.name} (传说)`);
      }
    }
  }

  // 统计
  const badgeCount = await prisma.badge.count();
  const rarityStats = await prisma.badge.groupBy({
    by: ['rarity'],
    _count: true,
  });

  console.log('\n\n📊 创建完成统计:');
  console.log(`  总纪念品数: ${badgeCount}`);
  console.log('  按稀有度分布:');
  rarityStats.forEach((stat) => {
    const emoji = {
      common: '⚪',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡',
    }[stat.rarity] || '⚫';
    console.log(`    ${emoji} ${stat.rarity}: ${stat._count}`);
  });

  console.log('\n✅ 纪念品数据创建完成！\n');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
