// scripts/test-concurrency.ts
/**
 * 高并发抢票测试脚本
 *
 * 使用方法：
 * npx tsx scripts/test-concurrency.ts
 *
 * 测试场景：
 * - 模拟 100 个用户同时抢 10 张票
 * - 验证是否出现超卖
 * - 验证 FOR UPDATE SKIP LOCKED 是否生效
 */

import prisma from '../lib/prisma';
import { createHoldWithLock } from '../lib/inventory';

async function testConcurrentTicketLocking() {
  console.log('🚀 开始高并发抢票测试...\n');

  // 1. 准备测试数据：创建一个活动和票档
  console.log('📋 步骤 1: 准备测试数据');

  // 清理旧测试数据
  await prisma.ticket.deleteMany({
    where: { eventId: 9999, tierId: 9999 },
  });
  await prisma.hold.deleteMany({
    where: { eventId: '9999', tierId: '9999' },
  });
  await prisma.tier.deleteMany({
    where: { id: 9999 },
  });
  await prisma.event.deleteMany({
    where: { id: 9999 },
  });

  // 创建测试活动
  const event = await prisma.event.create({
    data: {
      id: 9999,
      name: '并发测试演唱会',
      city: '测试城市',
      venue: '测试场馆',
      date: '2025-12-31',
      time: '19:00',
      cover: 'https://example.com/test.jpg',
      artist: '测试艺人',
      desc: '用于高并发测试',
    },
  });

  // 创建测试票档
  const tier = await prisma.tier.create({
    data: {
      id: 9999,
      eventId: event.id,
      name: 'VIP票',
      price: 500,
      capacity: 10, // 只有 10 张票
      remaining: 10,
    },
  });

  // 创建 10 张票
  const tickets = [];
  for (let i = 1; i <= 10; i++) {
    tickets.push({
      id: `TEST_TICKET_${i}`,
      ticketCode: `TC_TEST_${String(i).padStart(4, '0')}`,
      eventId: event.id,
      tierId: tier.id,
      status: 'available',
      price: tier.price,
      // createdAt 会使用 Prisma 的默认值 now()
    });
  }
  await prisma.ticket.createMany({ data: tickets });

  console.log(`✅ 创建了 ${tickets.length} 张测试票\n`);

  // 2. 模拟 100 个用户同时抢 10 张票（每人抢 1 张）
  console.log('📋 步骤 2: 模拟 100 个并发请求（每人抢 1 张票）');
  console.log('⚡ 预期结果：只有 10 个请求成功，90 个失败\n');

  const concurrentUsers = 100;
  const now = Date.now();

  // 创建 100 个并发请求
  const promises = Array.from({ length: concurrentUsers }, (_, i) =>
    createHoldWithLock('9999', '9999', 1, now)
      .then((result) => ({ userId: i + 1, success: !!result, result }))
      .catch((error) => ({ userId: i + 1, success: false, error: error.message }))
  );

  // 等待所有请求完成
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const endTime = Date.now();

  // 3. 统计结果
  console.log('📊 测试结果统计：\n');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ 成功锁票: ${successCount} 个用户`);
  console.log(`❌ 锁票失败: ${failCount} 个用户`);
  console.log(`⏱️  总耗时: ${endTime - startTime}ms`);
  console.log(`⚡ 平均响应时间: ${((endTime - startTime) / concurrentUsers).toFixed(2)}ms\n`);

  // 4. 验证数据库状态
  console.log('📋 步骤 3: 验证数据库状态');

  const lockedTickets = await prisma.ticket.count({
    where: {
      eventId: 9999,
      tierId: 9999,
      status: 'locked',
    },
  });

  const availableTickets = await prisma.ticket.count({
    where: {
      eventId: 9999,
      tierId: 9999,
      status: 'available',
    },
  });

  const holdRecords = await prisma.hold.count({
    where: {
      eventId: '9999',
      tierId: '9999',
    },
  });

  console.log(`🔒 已锁定的票: ${lockedTickets} 张`);
  console.log(`✅ 可用的票: ${availableTickets} 张`);
  console.log(`📝 Hold 记录: ${holdRecords} 条\n`);

  // 5. 检查是否超卖
  const totalProcessed = lockedTickets + availableTickets;
  const isValid = totalProcessed === 10 && lockedTickets === successCount;

  if (isValid) {
    console.log('🎉 测试通过！没有出现超卖现象！');
    console.log('✅ FOR UPDATE SKIP LOCKED 机制工作正常\n');
  } else {
    console.log('❌ 测试失败！数据不一致！');
    console.log(`   预期锁定: ${successCount} 张`);
    console.log(`   实际锁定: ${lockedTickets} 张`);
    console.log(`   总票数: ${totalProcessed} 张（应该是 10 张）\n`);
  }

  // 6. 显示成功的用户
  console.log('📋 成功抢到票的用户：');
  const successfulUsers = results
    .filter(r => r.success)
    .map(r => `用户 ${r.userId}`)
    .slice(0, 10);
  console.log(successfulUsers.join(', '));

  // 7. 清理测试数据
  console.log('\n🧹 清理测试数据...');
  await prisma.ticket.deleteMany({
    where: { eventId: 9999 },
  });
  await prisma.hold.deleteMany({
    where: { eventId: '9999' },
  });
  await prisma.tier.deleteMany({
    where: { id: 9999 },
  });
  await prisma.event.deleteMany({
    where: { id: 9999 },
  });

  console.log('✅ 测试完成！\n');

  // 断开数据库连接
  await prisma.$disconnect();
}

// 运行测试
testConcurrentTicketLocking()
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
