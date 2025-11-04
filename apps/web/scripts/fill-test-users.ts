// scripts/fill-test-users.ts
/**
 * 填充测试用户的空字段
 * 填充内容：email, password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充测试用户数据...\n');

  // 测试用户数据
  const testUsers = [
    {
      phone: '13800138001',
      email: 'music.lover@test.com',
      nickname: '音乐狂热者',
    },
    {
      phone: '13800138002',
      email: 'concert.fan@test.com',
      nickname: '演唱会达人',
    },
    {
      phone: '13800138003',
      email: 'star.chaser@test.com',
      nickname: '追星少女',
    },
    {
      phone: '13800138004',
      email: 'live.enthusiast@test.com',
      nickname: '现场控',
    },
  ];

  // 统一的测试密码
  const testPassword = 'test123';
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  console.log('测试密码:', testPassword);
  console.log('密码哈希:', hashedPassword.substring(0, 30) + '...\n');

  let updatedCount = 0;

  for (const userData of testUsers) {
    const user = await prisma.user.findUnique({
      where: { phone: userData.phone },
    });

    if (!user) {
      console.log(`❌ 未找到用户: ${userData.phone}`);
      continue;
    }

    // 准备更新数据
    const updates: any = {};
    const changes: string[] = [];

    // 填充 email（如果为空）
    if (!user.email) {
      updates.email = userData.email;
      changes.push(`email: ${userData.email}`);
    }

    // 填充 password（如果为空）
    if (!user.password) {
      updates.password = hashedPassword;
      changes.push('password: test123');
    }

    // 如果有需要更新的字段
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { phone: userData.phone },
        data: updates,
      });
      updatedCount++;
      console.log(`✅ ${userData.nickname} (${userData.phone})`);
      console.log(`   更新: ${changes.join(', ')}\n`);
    } else {
      console.log(`⏭️  ${userData.nickname} (${userData.phone})`);
      console.log(`   跳过: 所有字段都已填充\n`);
    }
  }

  console.log(`\n完成！更新了 ${updatedCount} 个用户的数据。`);
  console.log('\n测试登录信息：');
  console.log('═══════════════════════════════════════');
  testUsers.forEach((user) => {
    console.log(`账号: ${user.phone} 或 ${user.email}`);
    console.log(`密码: ${testPassword}`);
    console.log('───────────────────────────────────────');
  });
}

main()
  .catch((e) => {
    console.error('错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
