import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始添加测试活动数据...');

  // 获取当前日期
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 未来日期（7天后）
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  // 未来日期（14天后）
  const farFutureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const farFutureDateStr = farFutureDate.toISOString().split('T')[0];

  // 未来日期（30天后）
  const veryFarFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const veryFarFutureDateStr = veryFarFutureDate.toISOString().split('T')[0];

  // 过去日期（7天前）
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pastDateStr = pastDate.toISOString().split('T')[0];

  // 过去日期（30天前）
  const oldPastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oldPastDateStr = oldPastDate.toISOString().split('T')[0];

  // 计算售票时间的辅助函数
  const getSaleTimes = (eventDateStr: string, eventStatus: 'future' | 'today' | 'past') => {
    const eventDate = new Date(eventDateStr);

    if (eventStatus === 'future') {
      // 未来活动：30天前开售，活动前1天停售
      const saleStartTime = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const saleEndTime = new Date(eventDate.getTime() - 1 * 24 * 60 * 60 * 1000);
      return { saleStatus: 'on_sale', saleStartTime, saleEndTime };
    } else if (eventStatus === 'today') {
      // 今天的活动：30天前开售，今天早上停售
      const saleStartTime = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const saleEndTime = new Date(eventDate.getTime());
      saleEndTime.setHours(8, 0, 0, 0); // 今天早上8点停售
      return { saleStatus: 'paused', saleStartTime, saleEndTime };
    } else {
      // 过去的活动：已结束
      const saleStartTime = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const saleEndTime = new Date(eventDate.getTime() - 1 * 24 * 60 * 60 * 1000);
      return { saleStatus: 'ended', saleStartTime, saleEndTime };
    }
  };

  const testEvents = [
    // 1. 演唱会 (concert) - 7天后
    {
      name: '周杰伦「嘉年华」世界巡回演唱会 - 北京站',
      category: 'concert',
      city: '北京',
      venue: '国家体育场（鸟巢）',
      date: futureDateStr,
      time: '19:30',
      ...getSaleTimes(futureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop',
      artist: '周杰伦',
      desc: '华语乐坛天王周杰伦2025全新巡回演唱会，携经典曲目回归，为您带来震撼视听盛宴。本次演唱会将演唱《晴天》《七里香》《稻香》等经典歌曲，并首次公开演绎全新专辑曲目。',
      tiers: [
        { name: 'VIP看台', price: 1680, capacity: 500, remaining: 500 },
        { name: 'A区看台', price: 980, capacity: 1000, remaining: 1000 },
        { name: 'B区看台', price: 680, capacity: 2000, remaining: 2000 },
        { name: 'C区看台', price: 380, capacity: 3000, remaining: 3000 },
      ],
    },
    // 2. 音乐节 (festival) - 14天后
    {
      name: '草莓音乐节 2025 - 上海站',
      category: 'festival',
      city: '上海',
      venue: '上海世博公园',
      date: farFutureDateStr,
      time: '14:00',
      ...getSaleTimes(farFutureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
      artist: '五月天、朴树、许巍等',
      desc: '春天最具活力的音乐盛会！草莓音乐节2025上海站集结国内外顶尖音乐人，三天两夜不间断演出，涵盖摇滚、民谣、电子、说唱等多种音乐风格。现场还有创意市集、美食街区等丰富体验。',
      tiers: [
        { name: '三日通票', price: 680, capacity: 3000, remaining: 3000 },
        { name: '单日票', price: 280, capacity: 5000, remaining: 5000 },
        { name: '学生票', price: 180, capacity: 2000, remaining: 2000 },
      ],
    },
    // 3. 展览 (exhibition) - 30天后
    {
      name: '莫奈与印象派大师真迹展',
      category: 'exhibition',
      city: '深圳',
      venue: '深圳当代艺术与城市规划馆',
      date: veryFarFutureDateStr,
      time: '10:00',
      ...getSaleTimes(veryFarFutureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1578926078261-92d7f6f7a0a9?w=800&h=600&fit=crop',
      artist: '法国奥赛博物馆',
      desc: '莫奈、雷诺阿、德加等印象派大师真迹首次来华！本次展览汇聚法国奥赛博物馆珍藏的60余幅印象派经典画作，包括莫奈《日出·印象》、雷诺阿《红磨坊的舞会》等传世之作。展期三个月，配有专业导览和互动体验区。',
      tiers: [
        { name: '单人票', price: 180, capacity: 500, remaining: 500 },
        { name: '双人票', price: 320, capacity: 300, remaining: 300 },
        { name: '学生票', price: 100, capacity: 200, remaining: 200 },
        { name: 'VIP导览票', price: 380, capacity: 50, remaining: 50 },
      ],
    },
    // 4. 音乐会 (musicale) - 30天后
    {
      name: '维也纳爱乐乐团新年音乐会',
      category: 'musicale',
      city: '广州',
      venue: '广州大剧院',
      date: veryFarFutureDateStr,
      time: '19:30',
      ...getSaleTimes(veryFarFutureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=600&fit=crop',
      artist: '维也纳爱乐乐团',
      desc: '世界顶级交响乐团维也纳爱乐乐团2025中国巡演广州站。指挥大师带领乐团演奏莫扎特、贝多芬、施特劳斯等古典音乐大师的经典作品。正装出席，感受高雅艺术的魅力。',
      tiers: [
        { name: 'VIP池座', price: 1580, capacity: 200, remaining: 200 },
        { name: '一楼前排', price: 980, capacity: 300, remaining: 300 },
        { name: '一楼后排', price: 680, capacity: 400, remaining: 400 },
        { name: '二楼座位', price: 380, capacity: 500, remaining: 500 },
      ],
    },

    // 5. 话剧/演出 (show) - 14天后
    {
      name: '开心麻花爆笑舞台剧《乌龙山伯爵》',
      category: 'show',
      city: '北京',
      venue: '北京喜剧院',
      date: farFutureDateStr,
      time: '19:30',
      ...getSaleTimes(farFutureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
      artist: '开心麻花',
      desc: '开心麻花经典爆笑舞台剧《乌龙山伯爵》，笑到停不下来！一场阴差阳错的身份互换，引发连环乌龙趣事。全程高能，笑点密集，适合全家观看。',
      tiers: [
        { name: 'VIP座', price: 480, capacity: 100, remaining: 100 },
        { name: '甲票', price: 380, capacity: 200, remaining: 200 },
        { name: '乙票', price: 280, capacity: 300, remaining: 300 },
        { name: '丙票', price: 180, capacity: 200, remaining: 200 },
      ],
    },

    // 6. 体育赛事 (sports) - 7天后
    {
      name: 'CBA总决赛 - 广东vs辽宁',
      category: 'sports',
      city: '深圳',
      venue: '深圳宝安体育馆',
      date: futureDateStr,
      time: '19:35',
      ...getSaleTimes(futureDateStr, 'future'),
      cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
      artist: 'CBA中国男子篮球职业联赛',
      desc: 'CBA 2024-2025赛季总决赛第三场，广东东莞银行主场迎战辽宁本钢。两支冠军球队巅峰对决，见证中国篮球最高水平的较量！',
      tiers: [
        { name: 'VIP场边座', price: 1280, capacity: 100, remaining: 100 },
        { name: '内场座位', price: 680, capacity: 500, remaining: 500 },
        { name: '看台A区', price: 380, capacity: 1000, remaining: 1000 },
        { name: '看台B区', price: 180, capacity: 2000, remaining: 2000 },
      ],
    },

    // 7. 今天的活动（进行中）- 演唱会
    {
      name: '陈奕迅「FEAR AND DREAMS」演唱会 - 成都站',
      category: 'concert',
      city: '成都',
      venue: '成都露天音乐公园',
      date: today,
      time: '19:30',
      ...getSaleTimes(today, 'today'),
      cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
      artist: '陈奕迅 Eason Chan',
      desc: 'Eason陈奕迅「FEAR AND DREAMS」巡回演唱会成都站。现场演唱《十年》《富士山下》《K歌之王》等经典曲目。',
      tiers: [
        { name: 'VIP内场', price: 1880, capacity: 500, remaining: 0 },
        { name: 'A区看台', price: 1280, capacity: 1000, remaining: 0 },
        { name: 'B区看台', price: 780, capacity: 1500, remaining: 0 },
      ],
    },

    // 8. 已结束的活动 - 演唱会
    {
      name: '薛之谦「天外来物」巡回演唱会 - 杭州站',
      category: 'concert',
      city: '杭州',
      venue: '杭州奥体中心',
      date: pastDateStr,
      time: '19:30',
      ...getSaleTimes(pastDateStr, 'past'),
      cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop',
      artist: '薛之谦',
      desc: '薛之谦「天外来物」巡回演唱会杭州站已圆满结束。感谢所有到场支持的歌迷朋友们！',
      tiers: [
        { name: 'VIP内场', price: 1280, capacity: 800, remaining: 0 },
        { name: 'A区看台', price: 880, capacity: 1200, remaining: 0 },
        { name: 'B区看台', price: 580, capacity: 1800, remaining: 0 },
      ],
    },

    // 9. 已结束的活动 - 展览
    {
      name: 'teamLab无界美术馆沉浸式数字艺术展',
      category: 'exhibition',
      city: '上海',
      venue: '上海黄浦滨江',
      date: oldPastDateStr,
      time: '10:00',
      ...getSaleTimes(oldPastDateStr, 'past'),
      cover: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=600&fit=crop',
      artist: 'teamLab艺术团队',
      desc: 'teamLab无界美术馆数字艺术展已圆满结束。感谢所有观众的支持，期待下次相遇！',
      tiers: [
        { name: '成人票', price: 228, capacity: 1000, remaining: 0 },
        { name: '儿童票', price: 168, capacity: 500, remaining: 0 },
        { name: '家庭票', price: 568, capacity: 300, remaining: 0 },
      ],
    },
  ];

  for (const eventData of testEvents) {
    const { tiers, ...eventInfo } = eventData;

    console.log(`\n创建活动: ${eventInfo.name}`);
    console.log(`  售票状态: ${eventInfo.saleStatus}`);
    console.log(`  开售时间: ${eventInfo.saleStartTime.toISOString()}`);
    console.log(`  停售时间: ${eventInfo.saleEndTime.toISOString()}`);

    const event = await prisma.event.create({
      data: {
        ...eventInfo,
        tiers: {
          create: tiers.map((tier) => ({
            name: tier.name,
            price: tier.price,
            capacity: tier.capacity,
            remaining: tier.remaining,
          })),
        },
      },
      include: {
        tiers: true,
      },
    });

    console.log(`✅ 已创建活动 ID: ${event.id}`);
    console.log(`   票档数量: ${event.tiers.length}`);
  }

  console.log('\n🎉 测试活动数据添加完成！');
  console.log(`\n📊 统计:`);
  console.log(`   - 售票中: 6 个活动`);
  console.log(`     • 演唱会: 1 个`);
  console.log(`     • 音乐节: 1 个`);
  console.log(`     • 展览: 1 个`);
  console.log(`     • 音乐会: 1 个`);
  console.log(`     • 话剧演出: 1 个`);
  console.log(`     • 体育赛事: 1 个`);
  console.log(`   - 暂停售票: 1 个活动（演出进行中）`);
  console.log(`   - 已结束: 2 个活动（演唱会、展览）`);
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
