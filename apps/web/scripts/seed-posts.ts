// scripts/seed-posts.ts
/**
 * 创建安可区测试数据
 */

import prisma from '../lib/prisma';

async function main() {
  console.log('🌱 开始创建安可区测试数据...');

  // 1. 创建测试用户（如果不存在）
  const users = await Promise.all([
    prisma.user.upsert({
      where: { phone: '13800138001' },
      update: {},
      create: {
        phone: '13800138001',
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
        nickname: '现场控',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4',
        authProvider: 'local',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个测试用户`);

  // 2. 获取活动数据
  const events = await prisma.event.findMany({
    take: 3,
  });

  console.log(`✅ 找到 ${events.length} 个活动`);

  // 3. 创建帖子
  const postsData = [
    {
      userId: users[0].id,
      content: '昨晚的演唱会太震撼了！现场氛围绝了，灯光音响都是顶级的，全程高能！五月天不愧是演唱会之王 🎤✨',
      eventId: events[0]?.id,
      location: '北京工人体育场',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', width: 800, height: 600, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', width: 800, height: 1200, order: 1 },
        { imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', width: 800, height: 600, order: 2 },
      ],
    },
    {
      userId: users[1].id,
      content: '第一次看livehouse，距离舞台这么近真的太爽了！主唱的声音现场比录音更有感染力 🎸🔥',
      eventId: events[1]?.id,
      location: 'MAO Livehouse 上海',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', width: 800, height: 1066, order: 0 },
      ],
    },
    {
      userId: users[2].id,
      content: '终于抢到了前排！距离爱豆这么近，感觉做梦一样。应援棒的海洋太美了 💜💜💜',
      eventId: events[2]?.id,
      location: '上海梅赛德斯奔驰文化中心',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800', width: 800, height: 533, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', width: 800, height: 1200, order: 1 },
      ],
    },
    {
      userId: users[3].id,
      content: '音乐节第二天，草地躺平听音乐的感觉太舒服了。这次阵容真的太强了，每个乐队都好听！',
      location: '世纪公园',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800', width: 800, height: 1200, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800', width: 800, height: 600, order: 1 },
        { imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800', width: 800, height: 600, order: 2 },
        { imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', width: 800, height: 533, order: 3 },
      ],
    },
    {
      userId: users[0].id,
      content: '散场后在附近小店吃夜宵，遇到了同场的朋友，大家一起回味演唱会的精彩瞬间，这种感觉真好 🍜',
      location: '朝阳区',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800', width: 800, height: 1066, order: 0 },
      ],
    },
    {
      userId: users[1].id,
      content: '第一次带爸妈看演唱会，他们说没想到现场这么震撼。老爸还跟着一起合唱了，太可爱了哈哈哈 👨‍👩‍👦',
      eventId: events[0]?.id,
      location: '北京工人体育场',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800', width: 800, height: 600, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800', width: 800, height: 1200, order: 1 },
      ],
    },
    {
      userId: users[2].id,
      content: '这次的舞美设计真的太赞了！LED屏幕+灯光+烟雾，每一帧都是大片。手机拍不出现场的震撼感 📸✨',
      eventId: events[1]?.id,
      location: '深圳湾体育中心',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800', width: 800, height: 533, order: 0 },
      ],
    },
    {
      userId: users[3].id,
      content: '安可三首！主唱说："你们的热情让我们不想下台"。全场大合唱真的要哭了 😭',
      eventId: events[2]?.id,
      location: '广州天河体育馆',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800', width: 800, height: 1200, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', width: 800, height: 533, order: 1 },
      ],
    },
    {
      userId: users[0].id,
      content: '排队进场的时候认识的小伙伴，现在已经成了好朋友。演唱会的缘分真的很奇妙 🤝',
      location: '杭州奥体中心',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', width: 800, height: 600, order: 0 },
      ],
    },
    {
      userId: users[1].id,
      content: '今天的特殊嘉宾太惊喜了！完全没想到会来，全场尖叫声快把屋顶掀了 🎉',
      eventId: events[0]?.id,
      location: '成都大魔方演艺中心',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800', width: 800, height: 1066, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', width: 800, height: 600, order: 1 },
        { imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', width: 800, height: 1200, order: 2 },
      ],
    },
    {
      userId: users[2].id,
      content: '我的演唱会周边到货啦！质量超好，特别是这个荧光棒，设计感满满 ✨',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', width: 800, height: 1200, order: 0 },
      ],
    },
    {
      userId: users[3].id,
      content: '下雨也挡不住我们的热情！全场打开手机闪光灯的时候，像星空一样美 🌟☔',
      location: '鸟巢',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', width: 800, height: 533, order: 0 },
        { imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', width: 800, height: 1066, order: 1 },
      ],
    },
  ];

  console.log('🎨 开始创建帖子...');

  const createdPosts = [];
  for (const postData of postsData) {
    const { images, ...postInfo } = postData;

    const post = await prisma.post.create({
      data: {
        ...postInfo,
        viewCount: Math.floor(Math.random() * 1000) + 100,
        likeCount: Math.floor(Math.random() * 200) + 10,
        commentCount: Math.floor(Math.random() * 50) + 5,
        images: {
          create: images,
        },
      },
    });

    createdPosts.push(post);
  }

  console.log(`✅ 创建了 ${createdPosts.length} 条帖子`);

  // 4. 创建一些点赞
  console.log('❤️ 创建点赞数据...');
  const likes = [];
  for (const post of createdPosts.slice(0, 5)) {
    for (const user of users.slice(0, 3)) {
      try {
        const like = await prisma.postLike.create({
          data: {
            postId: post.id,
            userId: user.id,
          },
        });
        likes.push(like);
      } catch (error) {
        // 忽略重复点赞错误
      }
    }
  }

  console.log(`✅ 创建了 ${likes.length} 条点赞记录`);

  // 5. 创建一些评论
  console.log('💬 创建评论数据...');
  const comments = [];
  const commentTexts = [
    '太棒了！我也想去现场 😍',
    '好羡慕啊，下次一定要抢到票',
    '现场氛围看起来超级好',
    '这个角度拍的真不错！',
    '跟你一起去的那场，超级开心！',
    '主唱唱功真的绝了',
    '期待下一场！',
    '这是我见过最好的演唱会之一',
  ];

  for (const post of createdPosts.slice(0, 6)) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numComments; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomText = commentTexts[Math.floor(Math.random() * commentTexts.length)];

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: randomUser.id,
          content: randomText,
          likeCount: Math.floor(Math.random() * 20),
        },
      });
      comments.push(comment);
    }
  }

  console.log(`✅ 创建了 ${comments.length} 条评论`);

  console.log('\n🎉 测试数据创建完成！');
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
