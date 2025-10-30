// scripts/test-badges.ts
/**
 * 测试纪念品系统
 *
 * 为已支付的订单自动分配纪念品
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎁 开始为用户分配纪念品...\n');

  // 查找所有已支付的订单
  const paidOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
    },
    include: {
      tickets: true,
      user: true,
    },
  });

  console.log(`📦 找到 ${paidOrders.length} 个已支付订单\n`);

  for (const order of paidOrders) {
    console.log(`\n💳 订单: ${order.id}`);
    console.log(`   用户: ${order.user?.nickname || order.user?.phone || order.userId}`);
    console.log(`   票数: ${order.tickets.length}`);

    // 为订单中的每张票分配纪念品
    for (const ticket of order.tickets) {
      console.log(`\n  🎫 处理票: ${ticket.ticketCode}`);

      // 1️⃣ 查找活动徽章（活动级别）
      const eventBadge = await prisma.badge.findFirst({
        where: {
          eventId: ticket.eventId,
          tierId: null,
          type: 'badge',
        },
      });

      if (eventBadge) {
        // 检查是否已经拥有（避免重复）
        const existing = await prisma.userBadge.findFirst({
          where: {
            userId: order.userId,
            badgeId: eventBadge.id,
          },
        });

        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId: order.userId,
              badgeId: eventBadge.id,
              ticketId: ticket.id,
              orderId: order.id,
              metadata: JSON.stringify({
                ticketCode: ticket.ticketCode,
                price: ticket.price,
              }),
            },
          });
          console.log(`     ✅ 获得活动徽章: ${eventBadge.name} (${eventBadge.rarity})`);
        } else {
          console.log(`     ⏭️  已拥有活动徽章: ${eventBadge.name}`);
        }
      }

      // 2️⃣ 查找票根纪念品（票档级别）
      const ticketStub = await prisma.badge.findFirst({
        where: {
          eventId: ticket.eventId,
          tierId: ticket.tierId,
          type: 'ticket_stub',
        },
      });

      if (ticketStub) {
        const existing = await prisma.userBadge.findFirst({
          where: {
            userId: order.userId,
            badgeId: ticketStub.id,
            ticketId: ticket.id, // 每张票一个票根
          },
        });

        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId: order.userId,
              badgeId: ticketStub.id,
              ticketId: ticket.id,
              orderId: order.id,
              metadata: JSON.stringify({
                ticketCode: ticket.ticketCode,
                price: ticket.price,
                seatNumber: `未分配`, // 可以添加实际座位号
              }),
            },
          });
          console.log(`     ✅ 获得票根: ${ticketStub.name} (${ticketStub.rarity})`);
        } else {
          console.log(`     ⏭️  已拥有票根`);
        }
      }

      // 3️⃣ 查找限量海报（VIP/内场票档专享）
      const poster = await prisma.badge.findFirst({
        where: {
          eventId: ticket.eventId,
          tierId: ticket.tierId,
          type: 'poster',
        },
      });

      if (poster) {
        const existing = await prisma.userBadge.findFirst({
          where: {
            userId: order.userId,
            badgeId: poster.id,
          },
        });

        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId: order.userId,
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
          console.log(`     🌟 获得限量海报: ${poster.name} (${poster.rarity})!`);
        } else {
          console.log(`     ⏭️  已拥有限量海报`);
        }
      }
    }
  }

  // 统计用户纪念品
  console.log('\n\n📊 用户纪念品统计:');
  const users = await prisma.user.findMany({
    include: {
      userBadges: {
        include: {
          badge: true,
        },
      },
    },
  });

  for (const user of users) {
    if (user.userBadges.length > 0) {
      console.log(`\n👤 ${user.nickname || user.phone || user.id}`);
      console.log(`   拥有 ${user.userBadges.length} 个纪念品:`);

      const grouped = user.userBadges.reduce((acc, ub) => {
        const rarity = ub.badge.rarity;
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(grouped).forEach(([rarity, count]) => {
        const emoji = {
          common: '⚪',
          rare: '🔵',
          epic: '🟣',
          legendary: '🟡',
        }[rarity] || '⚫';
        console.log(`     ${emoji} ${rarity}: ${count}`);
      });
    }
  }

  console.log('\n✅ 纪念品分配完成！\n');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
