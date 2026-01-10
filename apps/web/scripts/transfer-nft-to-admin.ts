import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 查找管理员用户
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, nickname: true, email: true, role: true }
  });

  if (!admin) {
    console.log('⚠️ 没有找到管理员账号');

    // 列出所有用户
    const users = await prisma.user.findMany({
      select: { id: true, nickname: true, email: true, role: true }
    });
    console.log('现有用户:', users);
    return;
  }

  console.log('找到管理员:', admin.nickname || admin.email);

  // 更新所有 UserNFT 的 userId 到管理员
  const updated = await prisma.userNFT.updateMany({
    data: { userId: admin.id }
  });

  console.log('✅ 已将', updated.count, '条 NFT 记录转移到管理员账号');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
