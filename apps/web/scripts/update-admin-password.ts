// scripts/update-admin-password.ts
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  console.log('生成的密码哈希:', hash);

  const user = await prisma.user.update({
    where: { phone: '17701790343' },
    data: { password: hash },
  });

  console.log('密码已更新:', user.phone, user.nickname);

  // 验证
  const isValid = await bcrypt.compare(password, hash);
  console.log('密码验证:', isValid ? '成功' : '失败');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
