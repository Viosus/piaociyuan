// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充数据...');

  // 1. 导入用户数据
  console.log('\n📥 导入用户数据...');
  try {
    const usersCSV = fs.readFileSync(path.join(process.cwd(), 'users_backup.csv'), 'utf-8');
    const userLines = usersCSV.split('\n').slice(1).filter(line => line.trim());

    for (const line of userLines) {
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      const [id, email, phone, password, nickname, avatar, role, wechatOpenId, qqOpenId, authProvider] = parts;
      if (id) {
        await prisma.user.upsert({
          where: { id },
          update: {},
          create: {
            id,
            email: email || null,
            phone: phone || null,
            password: password || null,
            nickname: nickname || null,
            avatar: avatar || null,
            role: role || 'user',
            wechatOpenId: wechatOpenId || null,
            qqOpenId: qqOpenId || null,
            authProvider: authProvider || 'local',
          },
        });
      }
    }
    console.log(`✅ 导入了 ${userLines.length} 个用户`);
  } catch (error) {
    console.log('⚠️  用户数据文件不存在，跳过导入');
  }

  // 2. 创建测试活动（使用upsert避免冲突）
  console.log('\n🎪 创建测试活动...');

  // 计算售票时间
  const event1Date = new Date('2025-06-15');
  const event1SaleStart = new Date(event1Date.getTime() - 30 * 24 * 60 * 60 * 1000); // 30天前开售
  const event1SaleEnd = new Date(event1Date.getTime() - 1 * 24 * 60 * 60 * 1000);   // 演出前1天停售

  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '周杰伦 2025 嘉年华世界巡回演唱会',
      category: 'concert',
      city: '北京',
      venue: '国家体育场（鸟巢）',
      date: '2025-06-15',
      time: '19:30',
      saleStatus: 'on_sale',
      saleStartTime: event1SaleStart,
      saleEndTime: event1SaleEnd,
      cover: 'https://images.unsplash.com/photo-1540039155733-5fca0c286bed?w=800',
      artist: '周杰伦',
      desc: '周杰伦2025年全新世界巡回演唱会北京站，经典歌曲全回顾，全新舞台震撼呈现！',
    },
  });

  const event2Date = new Date('2025-07-20');
  const event2SaleStart = new Date(event2Date.getTime() - 30 * 24 * 60 * 60 * 1000);
  const event2SaleEnd = new Date(event2Date.getTime() - 1 * 24 * 60 * 60 * 1000);

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Taylor Swift | The Eras Tour',
      category: 'concert',
      city: '上海',
      venue: '上海体育场',
      date: '2025-07-20',
      time: '19:00',
      saleStatus: 'on_sale',
      saleStartTime: event2SaleStart,
      saleEndTime: event2SaleEnd,
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      artist: 'Taylor Swift',
      desc: 'Taylor Swift时代巡演中国首站，横跨所有专辑时代的音乐盛宴！',
    },
  });

  console.log(`✅ 活动数据已准备`);

  // 3. 创建票档
  console.log('\n🎫 创建票档...');
  const tiers = await prisma.$transaction([
    prisma.tier.create({
      data: { id: 101, eventId: 1, name: 'VIP看台', price: 1680, capacity: 50, remaining: 50 },
    }),
    prisma.tier.create({
      data: { id: 102, eventId: 1, name: '内场站票', price: 980, capacity: 100, remaining: 100 },
    }),
    prisma.tier.create({
      data: { id: 103, eventId: 1, name: '普通看台', price: 299, capacity: 200, remaining: 200 },
    }),
    prisma.tier.create({
      data: { id: 201, eventId: 2, name: 'VIP内场', price: 2080, capacity: 30, remaining: 30 },
    }),
    prisma.tier.create({
      data: { id: 202, eventId: 2, name: '看台A区', price: 880, capacity: 150, remaining: 150 },
    }),
  ]);
  console.log(`✅ 创建了 ${tiers.length} 个票档`);

  // 4. 创建票库存
  console.log('\n🎟️ 创建票库存...');
  let ticketCount = 0;
  const tierData = [
    { eventId: 1, tierId: 101, capacity: 50, price: 1680, hasSeats: true },
    { eventId: 1, tierId: 102, capacity: 100, price: 980, hasSeats: false },
    { eventId: 1, tierId: 103, capacity: 200, price: 299, hasSeats: true },
    { eventId: 2, tierId: 201, capacity: 30, price: 2080, hasSeats: true },
    { eventId: 2, tierId: 202, capacity: 150, price: 880, hasSeats: true },
  ];

  for (const { eventId, tierId, capacity, price, hasSeats } of tierData) {
    for (let i = 1; i <= capacity; i++) {
      const seatNumber = hasSeats ? `${String.fromCharCode(65 + Math.floor((i - 1) / 20))}-${String(i).padStart(2, '0')}` : null;
      await prisma.ticket.create({
        data: {
          ticketCode: `${new Date().getFullYear()}-${String(eventId).padStart(4, '0')}-${String(tierId).padStart(2, '0')}-${String(ticketCount + 1).padStart(6, '0')}`,
          seatNumber,
          eventId,
          tierId,
          status: 'available',
          price,
        },
      });
      ticketCount++;
    }
  }
  console.log(`✅ 创建了 ${ticketCount} 张票`);

  // 5. 创建测试用户（用于帖子）
  console.log('\n👥 创建测试用户...');

  // 所有测试用户的默认密码: password123
  const defaultPassword = await bcrypt.hash('password123', 10);

  const testUsers = await prisma.$transaction([
    prisma.user.upsert({
      where: { phone: '13800138001' },
      update: {},
      create: {
        phone: '13800138001',
        password: defaultPassword,
        nickname: '音乐狂热者',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
        authProvider: 'local',
      },
    }),
    prisma.user.upsert({
      where: { phone: '13800138002' },
      update: {},
      create: {
        phone: '13800138002',
        password: defaultPassword,
        nickname: '演唱会达人',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
        authProvider: 'local',
      },
    }),
    prisma.user.upsert({
      where: { phone: '13800138003' },
      update: {},
      create: {
        phone: '13800138003',
        password: defaultPassword,
        nickname: '追星少女',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
        authProvider: 'local',
      },
    }),
    prisma.user.upsert({
      where: { phone: '13800138004' },
      update: {},
      create: {
        phone: '13800138004',
        password: defaultPassword,
        nickname: '现场控',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
        authProvider: 'local',
      },
    }),
    prisma.user.upsert({
      where: { phone: '13800138005' },
      update: {},
      create: {
        phone: '13800138005',
        password: defaultPassword,
        nickname: '潮玩收藏家',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5',
        authProvider: 'local',
      },
    }),
  ]);
  console.log(`✅ 创建了 ${testUsers.length} 个测试用户（密码: password123）`);

  // 6. 创建帖子
  console.log('\n📝 创建测试帖子...');
  const posts = [];

  // 帖子1：周杰伦演唱会现场
  const post1 = await prisma.post.create({
    data: {
      userId: testUsers[0].id,
      eventId: 1,
      content: '刚刚抢到周董演唱会的票！太激动了！！！内场站票，已经开始期待6月15号了🎤✨ 这次一定要听到《晴天》和《稻香》！',
      location: '北京',
      viewCount: 1248,
      likeCount: 342,
      commentCount: 56,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1540039155733-5fca0c286bed?w=800',
            width: 1920,
            height: 1280,
            order: 0,
          },
        ],
      },
    },
  });
  posts.push(post1);

  // 帖子2：Taylor Swift粉丝打卡
  const post2 = await prisma.post.create({
    data: {
      userId: testUsers[1].id,
      eventId: 2,
      content: 'OMG! Taylor要来上海了！！！The Eras Tour终于等到了！已经买好VIP内场，姐妹们谁一起？💜💜💜 #Swiftie #TheErasTour',
      location: '上海',
      viewCount: 2156,
      likeCount: 687,
      commentCount: 123,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
            width: 1920,
            height: 1080,
            order: 0,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
            width: 1920,
            height: 1280,
            order: 1,
          },
        ],
      },
    },
  });
  posts.push(post2);

  // 帖子3：演唱会装备分享
  const post3 = await prisma.post.create({
    data: {
      userId: testUsers[2].id,
      content: '给大家分享一下我的演唱会装备🎒 荧光棒、应援手幅、便携充电宝、降噪耳塞（保护听力很重要！）还有最重要的——相机📷 准备记录最精彩的瞬间！',
      location: '广州',
      viewCount: 892,
      likeCount: 234,
      commentCount: 45,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
            width: 1200,
            height: 1600,
            order: 0,
          },
        ],
      },
    },
  });
  posts.push(post3);

  // 帖子4：音乐节回忆
  const post4 = await prisma.post.create({
    data: {
      userId: testUsers[3].id,
      content: '翻到去年草莓音乐节的照片，那天的落日真的太美了🌅 虽然晒得跟碳一样黑，但是真的值！今年继续冲！',
      location: '成都',
      viewCount: 1567,
      likeCount: 445,
      commentCount: 78,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
            width: 1920,
            height: 1280,
            order: 0,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
            width: 1920,
            height: 1280,
            order: 1,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
            width: 1920,
            height: 1280,
            order: 2,
          },
        ],
      },
    },
  });
  posts.push(post4);

  // 帖子5：演唱会vlog预告
  const post5 = await prisma.post.create({
    data: {
      userId: testUsers[4].id,
      eventId: 1,
      content: '上次去看周杰伦的时候拍了超多素材，终于剪完了！明天发vlog，敬请期待🎬 预告图先放出来让大家眼馋一下哈哈哈',
      location: '北京',
      viewCount: 3421,
      likeCount: 892,
      commentCount: 167,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
            width: 1920,
            height: 1080,
            order: 0,
          },
        ],
      },
    },
  });
  posts.push(post5);

  // 帖子6：现场氛围分享
  const post6 = await prisma.post.create({
    data: {
      userId: testUsers[0].id,
      content: '这就是现场的魅力啊！！！全场大合唱真的太震撼了😭 手机录的视频完全不能还原那种氛围，只有亲临现场才能感受到！',
      location: '深圳',
      viewCount: 2345,
      likeCount: 678,
      commentCount: 91,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
            width: 1920,
            height: 1280,
            order: 0,
          },
        ],
      },
    },
  });
  posts.push(post6);

  // 帖子7：演唱会穿搭
  const post7 = await prisma.post.create({
    data: {
      userId: testUsers[1].id,
      eventId: 2,
      content: '为了Taylor的演唱会准备的outfit✨ 参考了她Midnights专辑的美学，闪片上衣+紫色系妆容！姐妹们觉得怎么样？',
      location: '上海',
      viewCount: 1876,
      likeCount: 543,
      commentCount: 72,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800',
            width: 1080,
            height: 1350,
            order: 0,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
            width: 1080,
            height: 1350,
            order: 1,
          },
        ],
      },
    },
  });
  posts.push(post7);

  // 帖子8：票根收藏
  const post8 = await prisma.post.create({
    data: {
      userId: testUsers[2].id,
      content: '我的演唱会票根收藏墙📌 从2018年到现在，每一张都是珍贵的回忆。最喜欢的还是左上角那张，那是我第一次看演唱会！现在有了次元收藏，以后可以直接收藏数字版了🎫✨',
      viewCount: 987,
      likeCount: 267,
      commentCount: 34,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1556139943-4bdca53adf1e?w=800',
            width: 1600,
            height: 1200,
            order: 0,
          },
        ],
      },
    },
  });
  posts.push(post8);

  // 帖子9：演唱会准备攻略
  const post9 = await prisma.post.create({
    data: {
      userId: testUsers[3].id,
      content: '【新手必看】第一次去演唱会要注意什么？\n1️⃣ 提前到场，熟悉场馆\n2️⃣ 充好电，带好充电宝\n3️⃣ 穿舒适的鞋！！！\n4️⃣ 别忘了身份证和票！\n5️⃣ 保护好自己的财物\n\n有其他建议的朋友欢迎补充～',
      location: '杭州',
      viewCount: 4567,
      likeCount: 1234,
      commentCount: 289,
    },
  });
  posts.push(post9);

  // 帖子10：演唱会美食分享
  const post10 = await prisma.post.create({
    data: {
      userId: testUsers[4].id,
      content: '演唱会散场后和朋友们去吃的夜宵🍜 聊着今晚的精彩瞬间，一直嗨到凌晨2点哈哈哈。这才是完整的演唱会体验！',
      location: '南京',
      viewCount: 1432,
      likeCount: 389,
      commentCount: 52,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
            width: 1920,
            height: 1280,
            order: 0,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
            width: 1920,
            height: 1280,
            order: 1,
          },
        ],
      },
    },
  });
  posts.push(post10);

  console.log(`✅ 创建了 ${posts.length} 条帖子`);

  // 7. 为帖子添加一些点赞
  console.log('\n❤️  添加帖子点赞...');
  let likeCount = 0;
  for (const post of posts.slice(0, 5)) {
    // 只为前5个帖子添加点赞
    for (let i = 0; i < Math.min(testUsers.length, 3); i++) {
      await prisma.postLike.create({
        data: {
          postId: post.id,
          userId: testUsers[i].id,
        },
      });
      likeCount++;
    }
  }
  console.log(`✅ 添加了 ${likeCount} 个点赞`);

  // 8. 为帖子添加一些评论
  console.log('\n💬 添加帖子评论...');
  const comments = await prisma.$transaction([
    prisma.comment.create({
      data: {
        postId: posts[0].id,
        userId: testUsers[1].id,
        content: '太棒了！我也想去😭',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[0].id,
        userId: testUsers[2].id,
        content: '周董的演唱会氛围真的绝了！',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[1].id,
        userId: testUsers[0].id,
        content: '姐妹我也买了！一起组队啊！',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[1].id,
        userId: testUsers[3].id,
        content: 'Swiftie集合！！！',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[4].id,
        userId: testUsers[2].id,
        content: '等更新！快发出来让我康康！',
      },
    }),
  ]);
  console.log(`✅ 添加了 ${comments.length} 条评论`);

  console.log('\n✨ 数据填充完成！\n');
}

main()
  .catch((e) => {
    console.error('❌ 填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });