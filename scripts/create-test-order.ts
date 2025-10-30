// scripts/create-test-order.ts
/**
 * 创建测试订单并自动分配纪念品
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛒 创建测试订单...\n');

  // 获取用户
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ 没有找到用户');
    return;
  }
  console.log(`👤 用户: ${user.nickname || user.phone || user.id}\n`);

  // 选择活动和票档 (THE9 内场票)
  const eventId = 3;
  const tierId = 302;
  const qty = 1;

  // 找到可用的票
  const availableTickets = await prisma.ticket.findMany({
    where: {
      eventId,
      tierId,
      status: 'available',
    },
    take: qty,
  });

  if (availableTickets.length < qty) {
    console.error(`❌ 没有足够的可用票`);
    return;
  }

  const ticketIds = availableTickets.map((t) => t.id);
  const orderId = `O_${Date.now()}_test`;
  const holdId = `H_${Date.now()}_test`;

  console.log(`📝 创建订单: ${orderId}`);
  console.log(`   活动ID: ${eventId}`);
  console.log(`   票档ID: ${tierId}`);
  console.log(`   数量: ${qty}`);
  console.log(`   票: ${ticketIds.join(', ')}\n`);

  // 创建订单
  const order = await prisma.order.create({
    data: {
      id: orderId,
      userId: user.id,
      eventId: String(eventId),
      tierId: String(tierId),
      qty,
      holdId,
      status: 'PAID', // 直接创建为已支付
      createdAt: BigInt(Date.now()),
      paidAt: BigInt(Date.now()),
    },
  });

  console.log(`✅ 订单创建成功\n`);

  // 更新票的状态
  await prisma.ticket.updateMany({
    where: {
      id: { in: ticketIds },
    },
    data: {
      status: 'sold',
      orderId: order.id,
      userId: user.id,
      purchasedAt: new Date(),
    },
  });

  console.log(`✅ 票已更新\n`);

  // 获取票的详细信息
  const tickets = await prisma.ticket.findMany({
    where: {
      id: { in: ticketIds },
    },
  });

  console.log(`🎁 开始分配纪念品...\n`);

  for (const ticket of tickets) {
    console.log(`  🎫 票: ${ticket.ticketCode}\n`);

    // 1️⃣ 活动徽章
    const eventBadge = await prisma.badge.findFirst({
      where: {
        eventId: ticket.eventId,
        tierId: null,
        type: 'badge',
      },
    });

    if (eventBadge) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: eventBadge.id,
          ticketId: ticket.id,
          orderId: order.id,
          metadata: JSON.stringify({
            ticketCode: ticket.ticketCode,
            price: ticket.price,
          }),
        },
      });
      console.log(`     ✅ 获得: ${eventBadge.name}`);
      console.log(`        类型: ${eventBadge.type}`);
      console.log(`        稀有度: ${eventBadge.rarity}\n`);
    }

    // 2️⃣ 票根
    const ticketStub = await prisma.badge.findFirst({
      where: {
        eventId: ticket.eventId,
        tierId: ticket.tierId,
        type: 'ticket_stub',
      },
    });

    if (ticketStub) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: ticketStub.id,
          ticketId: ticket.id,
          orderId: order.id,
          metadata: JSON.stringify({
            ticketCode: ticket.ticketCode,
            price: ticket.price,
          }),
        },
      });
      console.log(`     ✅ 获得: ${ticketStub.name}`);
      console.log(`        类型: ${ticketStub.type}`);
      console.log(`        稀有度: ${ticketStub.rarity}\n`);
    }

    // 3️⃣ 限量海报 (VIP/内场专享)
    const poster = await prisma.badge.findFirst({
      where: {
        eventId: ticket.eventId,
        tierId: ticket.tierId,
        type: 'poster',
      },
    });

    if (poster) {
      await prisma.userBadge.create({
        data: {
          userId: user.id,
          badgeId: poster.id,
          ticketId: ticket.id,
          orderId: order.id,
          metadata: JSON.stringify({
            ticketCode: ticket.ticketCode,
            price: ticket.price,
            limited: true,
          }),
        },
      });
      console.log(`     🌟 获得: ${poster.name}`);
      console.log(`        类型: ${poster.type}`);
      console.log(`        稀有度: ${poster.rarity}\n`);
    }
  }

  // 查询用户所有纪念品
  const userBadges = await prisma.userBadge.findMany({
    where: {
      userId: user.id,
    },
    include: {
      badge: true,
    },
  });

  console.log(`\n📊 用户纪念品收藏 (共 ${userBadges.length} 个):\n`);
  const grouped = userBadges.reduce((acc, ub) => {
    const rarity = ub.badge.rarity;
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(ub.badge.name);
    return acc;
  }, {} as Record<string, string[]>);

  const rarityOrder = ['legendary', 'epic', 'rare', 'common'];
  rarityOrder.forEach((rarity) => {
    if (grouped[rarity]) {
      const emoji = {
        common: '⚪',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡',
      }[rarity] || '⚫';
      console.log(`  ${emoji} ${rarity.toUpperCase()} (${grouped[rarity].length}):`);
      grouped[rarity].forEach((name) => {
        console.log(`     - ${name}`);
      });
      console.log('');
    }
  });

  console.log('✅ 测试完成！\n');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
