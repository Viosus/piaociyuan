/**
 * 测试数据 seeder
 *
 * 灌入一组带明确标记的测试数据用于功能回归。所有数据带可识别 marker
 * 方便 cleanup-test-data.js 一键清除。
 *
 * Markers：
 *   - User: phone 13900000001-005, email *@piaociyuan.test, nickname 以 [TEST] 开头
 *   - Event: name 以 [TEST] 开头, desc 以 [TEST_DATA] 开头
 *   - Post / Comment / Message: content 以 [TEST] 开头
 *
 * 用法（在 ECS 上）：
 *   docker cp apps/web/scripts/seed-test-data.js piaociyuan-web:/tmp/
 *   docker compose exec web node /tmp/seed-test-data.js
 *
 * 详见 docs/测试数据使用说明.md
 */

const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_PHONES = [
  '13900000001',
  '13900000002',
  '13900000003',
  '13900000004',
  '13900000099',
];
const TEST_PASSWORD = 'Test123456!';
const TEST_PASSWORD_HASH = bcryptjs.hashSync(TEST_PASSWORD, 12);
const EVENT_DESC_PREFIX = '[TEST_DATA] ';

async function main() {
  console.log('🌱 Seeding test data...\n');

  // ==================== 1. Users ====================
  const userSpec = [
    {
      phone: '13900000001',
      email: 'test-a@piaociyuan.test',
      nickname: '[TEST] 测试明星A',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-a',
      isVerified: true,
      verifiedType: 'celebrity',
      bio: '认证测试账号 / 主测试账号 / 用 phone 登录',
      role: 'user',
    },
    {
      phone: '13900000002',
      email: 'test-b@piaociyuan.test',
      nickname: '[TEST] 测试粉丝B',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-b',
      bio: '与 A 互相关注 / 与 A 有私信会话',
      role: 'user',
    },
    {
      phone: '13900000003',
      email: 'test-c@piaociyuan.test',
      nickname: '[TEST] 测试用户C',
      avatar: null,
      bio: '无头像测试 / 单向关注 A（A 未关注他）',
      role: 'user',
    },
    {
      phone: '13900000004',
      email: 'test-d@piaociyuan.test',
      nickname: '[TEST] 测试用户D',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-d',
      bio: '普通测试用户 / A 关注了 D',
      role: 'user',
    },
    {
      phone: '13900000099',
      email: 'test-admin@piaociyuan.test',
      nickname: '[TEST] 测试管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-admin',
      bio: '管理员测试账号',
      role: 'admin',
    },
  ];

  const users = [];
  for (const u of userSpec) {
    const existing = await prisma.user.findUnique({ where: { phone: u.phone } });
    if (existing) {
      console.log(`  · User ${u.phone} already exists, skip`);
      users.push(existing);
      continue;
    }
    const created = await prisma.user.create({
      data: { ...u, password: TEST_PASSWORD_HASH },
    });
    console.log(`  ✓ User: ${u.nickname} (${u.phone})`);
    users.push(created);
  }
  const [a, b, c, d] = users;

  // ==================== 2. UserFollows ====================
  const follows = [
    { followerId: a.id, followingId: b.id }, // a → b
    { followerId: b.id, followingId: a.id }, // b → a (互相)
    { followerId: c.id, followingId: a.id }, // c → a (单向)
    { followerId: a.id, followingId: d.id }, // a → d (单向)
  ];
  for (const f of follows) {
    await prisma.userFollow.upsert({
      where: { followerId_followingId: f },
      update: {},
      create: f,
    });
  }
  // 同步 follow 计数
  await prisma.user.update({
    where: { id: a.id },
    data: { followerCount: 2, followingCount: 2 },
  });
  await prisma.user.update({
    where: { id: b.id },
    data: { followerCount: 1, followingCount: 1 },
  });
  await prisma.user.update({
    where: { id: c.id },
    data: { followerCount: 0, followingCount: 1 },
  });
  await prisma.user.update({
    where: { id: d.id },
    data: { followerCount: 1, followingCount: 0 },
  });
  console.log('  ✓ Follow relations: a↔b 互相, c→a 单向, a→d 单向');

  // ==================== 3. Events ====================
  const eventSpec = [
    {
      name: '[TEST] 周杰伦 2026 嘉年华世界巡回演唱会',
      category: 'concert',
      city: '上海',
      venue: '虹口足球场',
      date: '2026-08-15',
      time: '19:30',
      saleStatus: 'on_sale',
      saleStartTime: new Date(Date.now() - 7 * 86400000),
      saleEndTime: new Date(Date.now() + 90 * 86400000),
      cover:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
      artist: '周杰伦',
      desc: EVENT_DESC_PREFIX + '测试演唱会，售票中状态',
    },
    {
      name: '[TEST] 草莓音乐节 2026',
      category: 'festival',
      city: '北京',
      venue: '通州运河公园',
      date: '2026-09-20',
      time: '12:00',
      saleStatus: 'not_started',
      saleStartTime: new Date(Date.now() + 7 * 86400000),
      saleEndTime: new Date(Date.now() + 60 * 86400000),
      cover:
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
      artist: '草东没有派对、五条人、Faye 飞、痛仰',
      desc: EVENT_DESC_PREFIX + '即将开售测试',
    },
    {
      name: '[TEST] 莫奈展览：印象之光',
      category: 'exhibition',
      city: '深圳',
      venue: '深圳美术馆',
      date: '2026-07-01',
      time: '10:00',
      saleStatus: 'sold_out',
      saleStartTime: new Date(Date.now() - 30 * 86400000),
      saleEndTime: new Date(Date.now() + 30 * 86400000),
      cover:
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200',
      artist: '莫奈基金会',
      desc: EVENT_DESC_PREFIX + '已售罄测试',
    },
    {
      name: '[TEST] 话剧《雷雨》',
      category: 'show',
      city: '上海',
      venue: '上海大剧院',
      date: '2026-04-15',
      time: '19:30',
      saleStatus: 'ended',
      saleStartTime: new Date(Date.now() - 90 * 86400000),
      saleEndTime: new Date(Date.now() - 5 * 86400000),
      cover:
        'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
      artist: '上海话剧艺术中心',
      desc: EVENT_DESC_PREFIX + '已结束测试',
    },
  ];

  const events = [];
  for (const e of eventSpec) {
    const existing = await prisma.event.findFirst({ where: { name: e.name } });
    if (existing) {
      console.log(`  · Event "${e.name}" already exists, skip`);
      events.push(existing);
      continue;
    }
    const created = await prisma.event.create({ data: e });
    await prisma.tier.createMany({
      data: [
        { eventId: created.id, name: 'VIP', price: 2880, capacity: 100, remaining: 50, sold: 50 },
        { eventId: created.id, name: '普通票', price: 880, capacity: 500, remaining: 380, sold: 120 },
      ],
    });
    console.log(`  ✓ Event: ${e.name} (${e.saleStatus}) + 2 tiers`);
    events.push(created);
  }

  // ==================== 4. Posts ====================
  // post 1: 5 张图（测 W-S4 lightbox 多图导航）
  const existingPost1 = await prisma.post.findFirst({
    where: { userId: a.id, content: { startsWith: '[TEST] 看完周杰伦演唱会' } },
  });
  let post1 = existingPost1;
  if (!existingPost1) {
    post1 = await prisma.post.create({
      data: {
        userId: a.id,
        content: '[TEST] 看完周杰伦演唱会，现场气氛炸裂！附几张现场图～ 🎤🎶',
        eventId: events[0].id,
        location: '上海·虹口足球场',
        images: {
          create: [
            { imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600', width: 1600, height: 1067, order: 0 },
            { imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600', width: 1600, height: 1067, order: 1 },
            { imageUrl: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=1600', width: 1600, height: 1067, order: 2 },
            { imageUrl: 'https://images.unsplash.com/photo-1485119502052-3a35c2dbe614?w=1600', width: 1600, height: 1067, order: 3 },
            { imageUrl: 'https://images.unsplash.com/photo-1571266028243-0bda9d8a25e4?w=1600', width: 1600, height: 1067, order: 4 },
          ],
        },
      },
    });
    console.log('  ✓ Post 1: 5 张图（测 W-S4 lightbox + 键盘导航）');
  } else {
    console.log('  · Post 1 already exists, skip');
  }

  // post 2: 1 图 + 15 条评论 + 部分嵌套（测 W-S3 评论分页 + 回复展开）
  const existingPost2 = await prisma.post.findFirst({
    where: { userId: a.id, content: { startsWith: '[TEST] 大家觉得这次草莓音乐节' } },
  });
  let post2 = existingPost2;
  if (!existingPost2) {
    post2 = await prisma.post.create({
      data: {
        userId: a.id,
        content: '[TEST] 大家觉得这次草莓音乐节阵容怎么样？有想去的吗',
        eventId: events[1].id,
        location: '北京',
        images: {
          create: [
            { imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600', width: 1600, height: 1067, order: 0 },
          ],
        },
      },
    });

    // 15 条顶层评论
    const topComments = [];
    for (let i = 1; i <= 15; i++) {
      const author = [b, c, d][i % 3];
      const tc = await prisma.comment.create({
        data: {
          postId: post2.id,
          userId: author.id,
          content: `[TEST] 顶层评论 ${i}：${i % 4 === 0 ? '阵容好棒，准备买票！' : '蹲一个具体场次安排～'}`,
        },
      });
      topComments.push(tc);
    }
    // 前 3 条评论各加 5 条 reply（测嵌套展开）
    let replyTotal = 0;
    for (let i = 0; i < 3; i++) {
      const parent = topComments[i];
      for (let j = 1; j <= 5; j++) {
        const author = [a, b, c][j % 3];
        await prisma.comment.create({
          data: {
            postId: post2.id,
            userId: author.id,
            parentId: parent.id,
            content: `[TEST] 回复 ${j} → 评论 ${i + 1}: 同蹲！`,
          },
        });
        replyTotal++;
      }
    }
    await prisma.post.update({
      where: { id: post2.id },
      data: { commentCount: 15 + replyTotal },
    });
    console.log(`  ✓ Post 2: 1 图 + 15 顶层评论 + ${replyTotal} 回复（测 W-S3 分页 + 嵌套）`);
  } else {
    console.log('  · Post 2 already exists, skip');
  }

  // post 3: 纯文字
  const existingPost3 = await prisma.post.findFirst({
    where: { userId: a.id, content: { startsWith: '[TEST] 简单的纯文字' } },
  });
  let post3 = existingPost3;
  if (!existingPost3) {
    post3 = await prisma.post.create({
      data: {
        userId: a.id,
        content: '[TEST] 简单的纯文字帖子，测无图场景。这条会显示在 feed 中，但没有图片预览。',
      },
    });
    console.log('  ✓ Post 3: 纯文字（测无图场景）');
  } else {
    console.log('  · Post 3 already exists, skip');
  }

  // ==================== 5. Conversation a ↔ b 80 messages ====================
  const existingConv = await prisma.conversation.findFirst({
    where: {
      type: 'private',
      participants: {
        every: { userId: { in: [a.id, b.id] } },
      },
    },
  });

  if (!existingConv) {
    const conv = await prisma.conversation.create({
      data: {
        type: 'private',
        participants: {
          create: [{ userId: a.id }, { userId: b.id }],
        },
      },
    });

    const startTime = Date.now() - 7 * 86400000;
    const msgs = [];
    for (let i = 0; i < 80; i++) {
      const senderIsA = i % 2 === 0;
      msgs.push({
        conversationId: conv.id,
        senderId: senderIsA ? a.id : b.id,
        receiverId: senderIsA ? b.id : a.id,
        content:
          i % 5 === 0
            ? `[TEST] 消息 ${i + 1}: 这是一条比较长的测试消息，用来测试消息气泡的换行和宽度限制。也测试一下时间分隔显示是否正常。`
            : `[TEST] 消息 ${i + 1}`,
        createdAt: new Date(startTime + i * 600000),
        isRead: true,
      });
    }
    await prisma.message.createMany({ data: msgs });
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: msgs[msgs.length - 1].createdAt },
    });
    console.log('  ✓ Conversation a↔b: 80 条消息（测 W-S5 加载更早消息分页）');
  } else {
    console.log('  · Conversation a↔b already exists, skip');
  }

  // ==================== 6. Notifications for user a ====================
  const existingNotifs = await prisma.notification.count({
    where: { userId: a.id, content: { startsWith: '[TEST]' } },
  });
  if (existingNotifs === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: a.id,
          type: 'follow',
          title: '新粉丝',
          content: `[TEST] ${b.nickname} 关注了你`,
          isRead: false,
        },
        {
          userId: a.id,
          type: 'like',
          title: '收到点赞',
          content: `[TEST] ${c.nickname} 赞了你的动态`,
          isRead: false,
        },
        {
          userId: a.id,
          type: 'comment',
          title: '新评论',
          content: `[TEST] ${d.nickname} 评论了你的动态：好棒呀！`,
          isRead: true,
        },
      ],
    });
    console.log('  ✓ Notifications for user a: 3 条（2 未读 / 1 已读）');
  } else {
    console.log(`  · ${existingNotifs} notifications for a already exist, skip`);
  }

  // ==================== 7. PostFavorites + EventFollows ====================
  if (post1) {
    await prisma.postFavorite.upsert({
      where: { postId_userId: { postId: post1.id, userId: a.id } },
      update: {},
      create: { postId: post1.id, userId: a.id },
    });
  }
  await prisma.eventFollow.upsert({
    where: { userId_eventId: { userId: a.id, eventId: events[0].id } },
    update: {},
    create: { userId: a.id, eventId: events[0].id },
  });
  console.log('  ✓ a 收藏 post 1, a 关注 event 1');

  // ==================== 输出登录凭证 ====================
  console.log('\n✅ Test data seeded successfully\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('登录凭证（所有测试账号通用）');
  console.log(`  密码: ${TEST_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('账号:');
  for (const u of userSpec) {
    console.log(`  · ${u.nickname.padEnd(18)} phone=${u.phone}  role=${u.role}${u.isVerified ? '  ⭐ verified' : ''}`);
  }
  console.log('\n清理命令（在 ECS 上）：');
  console.log('  docker cp apps/web/scripts/cleanup-test-data.js piaociyuan-web:/tmp/');
  console.log('  docker compose exec web node /tmp/cleanup-test-data.js');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
