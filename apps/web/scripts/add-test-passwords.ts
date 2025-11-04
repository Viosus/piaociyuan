// scripts/add-test-passwords.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 为测试用户添加密码...');

  // 统一密码: password123
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const testPhones = [
    '17701790343',
    '13800138001',
    '13800138002',
    '13800138003',
    '13800138004',
    '13800138005',
  ];

  let updated = 0;
  for (const phone of testPhones) {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (user) {
      await prisma.user.update({
        where: { phone },
        data: { password: hashedPassword },
      });
      console.log(`✅ 更新用户 ${phone} (${user.nickname}) 的密码`);
      updated++;
    } else {
      console.log(`⚠️  用户 ${phone} 不存在`);
    }
  }

  console.log(`\n✨ 完成！共更新 ${updated} 个用户的密码`);
  console.log(`📝 所有用户的密码都是: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
