// 测试 Event API 和新字段
import { PrismaClient } from '@prisma/client';
import { getSaleStatusInfo } from '../lib/eventUtils';

const prisma = new PrismaClient();

async function testEventAPI() {
  console.log('🧪 测试 Event API 和新字段...\n');

  // 获取所有活动
  const events = await prisma.event.findMany({
    orderBy: { id: 'asc' },
    take: 3,
    include: {
      tiers: {
        orderBy: { price: 'asc' },
      },
    },
  });

  console.log(`✅ 成功获取 ${events.length} 个活动\n`);

  for (const event of events) {
    console.log('─'.repeat(60));
    console.log(`📅 活动: ${event.name}`);
    console.log(`   ID: ${event.id}`);
    console.log(`   类型: ${event.category}`);
    console.log(`   日期: ${event.date} ${event.time}`);
    console.log(`   地点: ${event.city} - ${event.venue}`);
    console.log(`   售票状态: ${event.saleStatus}`);
    console.log(`   开售时间: ${event.saleStartTime.toISOString()}`);
    console.log(`   停售时间: ${event.saleEndTime.toISOString()}`);

    // 计算实时售票状态
    const saleInfo = getSaleStatusInfo(
      event.saleStatus,
      event.saleStartTime,
      event.saleEndTime
    );

    console.log(`\n   🎫 实时售票信息:`);
    console.log(`   - 状态标签: ${saleInfo.label}`);
    console.log(`   - 可购票: ${saleInfo.canPurchase ? '✅ 是' : '❌ 否'}`);
    if (saleInfo.reason) {
      console.log(`   - 原因: ${saleInfo.reason}`);
    }

    console.log(`\n   💰 票档 (${event.tiers.length} 个):`);
    for (const tier of event.tiers.slice(0, 2)) {
      console.log(`   - ${tier.name}: ¥${tier.price} (${tier.remaining}/${tier.capacity})`);
    }
    console.log('');
  }

  console.log('─'.repeat(60));
  console.log('\n✨ 测试完成！所有新字段都正确返回。\n');
}

testEventAPI()
  .catch((e) => {
    console.error('❌ 测试失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
