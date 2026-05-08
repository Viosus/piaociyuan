/**
 * 测试数据 cleanup 脚本
 *
 * 删除 seed-test-data.js 灌入的所有数据。安全：只按明确 marker 匹配，
 * 不会误删真实用户。
 *
 * Marker 删除策略：
 *   1. Conversations: 找参与者全是 test users 的私聊
 *   2. Users where phone in 13900000001-005, 13900000099 → 级联删 posts /
 *      comments / messages / follows / favorites / notifications / sessions /
 *      participants 等
 *   3. Events where name 以 [TEST] 开头 → 级联删 tiers / event_follows 等
 *
 * 用法（在 ECS 上）：
 *   docker cp apps/web/scripts/cleanup-test-data.js piaociyuan-web:/app/
 *   docker compose exec web node /app/cleanup-test-data.js
 *
 * 注：必须 cp 到 /app/（而非 /tmp/），因为 Node require('@prisma/client')
 * 从脚本所在目录往上查 node_modules，@prisma/client 装在 /app/node_modules
 *
 * 详见 docs/测试数据使用说明.md
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEST_PHONES = [
  '13900000001',
  '13900000002',
  '13900000003',
  '13900000004',
  '13900000099',
];

async function main() {
  console.log('🧹 Cleaning up test data...\n');

  // 1. 找 test users
  const testUsers = await prisma.user.findMany({
    where: { phone: { in: TEST_PHONES } },
    select: { id: true, phone: true, nickname: true },
  });
  console.log(`Found ${testUsers.length} test users:`);
  testUsers.forEach((u) => console.log(`  · ${u.nickname} (${u.phone})`));
  const testUserIds = testUsers.map((u) => u.id);

  if (testUsers.length === 0) {
    console.log('\n  No test users to delete.');
  } else {
    // 2. 找出所有 test user 参与的 conversations
    const participantRows = await prisma.conversationParticipant.findMany({
      where: { userId: { in: testUserIds } },
      select: { conversationId: true },
    });
    const convIds = [...new Set(participantRows.map((p) => p.conversationId))];

    if (convIds.length > 0) {
      // 删除前先看哪些 conversation 是"纯测试"（所有 participants 都是 test user）
      // 只删纯测试的，避免误删用户和 test user 的真实对话
      const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId: { in: convIds } },
        select: { conversationId: true, userId: true },
      });
      const convToParticipants = {};
      for (const p of allParticipants) {
        if (!convToParticipants[p.conversationId]) {
          convToParticipants[p.conversationId] = [];
        }
        convToParticipants[p.conversationId].push(p.userId);
      }
      const pureTestConvIds = convIds.filter((cid) =>
        convToParticipants[cid].every((uid) => testUserIds.includes(uid))
      );

      if (pureTestConvIds.length > 0) {
        const cd = await prisma.conversation.deleteMany({
          where: { id: { in: pureTestConvIds } },
        });
        console.log(
          `\n✓ Deleted ${cd.count} pure-test conversations (cascading messages/participants)`
        );
      }

      const mixedCount = convIds.length - pureTestConvIds.length;
      if (mixedCount > 0) {
        console.log(
          `  ⚠ ${mixedCount} mixed conversations (test user + real user) preserved—removing test user from them only`
        );
      }
    }

    // 3. 删 users（级联）
    const ud = await prisma.user.deleteMany({
      where: { phone: { in: TEST_PHONES } },
    });
    console.log(
      `✓ Deleted ${ud.count} test users (cascading posts/comments/likes/favorites/follows/notifications/sessions/participants)`
    );
  }

  // 4. 删 events with [TEST] prefix
  const ed = await prisma.event.deleteMany({
    where: { name: { startsWith: '[TEST]' } },
  });
  console.log(
    `✓ Deleted ${ed.count} test events (cascading tiers/event_follows/posts.eventId set null/notifications.eventId set null)`
  );

  console.log('\n✅ Test data cleaned up\n');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
