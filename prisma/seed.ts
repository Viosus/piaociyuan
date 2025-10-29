// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始导入初始数据...');

  // 清空现有数据
  await prisma.order.deleteMany();
  await prisma.hold.deleteMany();
  await prisma.tier.deleteMany();
  await prisma.event.deleteMany();

  // 导入活动和票档
  await prisma.event.create({
    data: {
      id: 1,
      name: 'INTO1 南京演唱会',
      city: '南京',
      venue: '南京青奥体育公园体育馆',
      date: '2025-12-10',
      time: '19:30',
      cover: 'https://picsum.photos/1200/600?random=11',
      artist: 'INTO1',
      desc: 'INTO1 全国巡演南京站，限量应援周边现场发放，支持实名制与电子票。',
      tiers: {
        create: [
          { id: 101, name: '看台A', price: 380, capacity: 150, remaining: 150 },
          { id: 102, name: '看台B', price: 480, capacity: 100, remaining: 100 },
          { id: 103, name: '内场', price: 680, capacity: 50, remaining: 50 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      id: 2,
      name: '时代少年团 苏州见面会',
      city: '苏州',
      venue: '苏州奥体中心体育馆',
      date: '2025-11-20',
      time: '19:00',
      cover: 'https://picsum.photos/1200/600?random=22',
      artist: '时代少年团',
      desc: '限定城市特别场，现场互动与惊喜环节，支持电子纪念品。',
      tiers: {
        create: [
          { id: 201, name: '普通票', price: 299, capacity: 200, remaining: 200 },
          { id: 202, name: 'VIP', price: 599, capacity: 50, remaining: 50 },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      id: 3,
      name: 'THE9 南京重聚演唱会',
      city: '南京',
      venue: '南京奥体中心体育馆',
      date: '2026-01-05',
      time: '19:30',
      cover: 'https://picsum.photos/1200/600?random=33',
      artist: 'THE9',
      desc: '重聚特别舞台，经典曲目全新编排，粉丝应援区限定。',
      tiers: {
        create: [
          { id: 301, name: '看台', price: 420, capacity: 150, remaining: 150 },
          { id: 302, name: '内场', price: 720, capacity: 60, remaining: 60 },
        ],
      },
    },
  });

  console.log('✅ 初始数据导入完成！');
  console.log('   - 活动数量: 3');
  console.log('   - 票档数量: 7');
}

main()
  .catch((e) => {
    console.error('❌ 导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });