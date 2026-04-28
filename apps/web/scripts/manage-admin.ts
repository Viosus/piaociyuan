/**
 * 管理员资格管理 CLI 脚本
 *
 * 使用方法：
 *   # 添加管理员（通过手机号）
 *   npx ts-node apps/web/scripts/manage-admin.ts add --phone 13800000000
 *
 *   # 添加管理员（通过邮箱）
 *   npx ts-node apps/web/scripts/manage-admin.ts add --email admin@example.com
 *
 *   # 查看所有管理员
 *   npx ts-node apps/web/scripts/manage-admin.ts list
 *
 *   # 移除管理员权限（降为普通用户）
 *   npx ts-node apps/web/scripts/manage-admin.ts remove --phone 13800000000
 *
 * 注意：需要在项目根目录或 apps/web 目录下执行，确保 DATABASE_URL 环境变量已设置
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser(args: string[]) {
  const phoneIdx = args.indexOf('--phone');
  const emailIdx = args.indexOf('--email');
  const idIdx = args.indexOf('--id');

  if (phoneIdx !== -1 && args[phoneIdx + 1]) {
    const phone = args[phoneIdx + 1];
    return prisma.user.findUnique({ where: { phone } });
  }

  if (emailIdx !== -1 && args[emailIdx + 1]) {
    const email = args[emailIdx + 1];
    return prisma.user.findUnique({ where: { email } });
  }

  if (idIdx !== -1 && args[idIdx + 1]) {
    const id = args[idIdx + 1];
    return prisma.user.findUnique({ where: { id } });
  }

  return null;
}

async function addAdmin(args: string[]) {
  const user = await findUser(args);

  if (!user) {
    console.error('❌ 用户不存在。请确认手机号/邮箱/ID 是否正确。');
    console.error('   用法: npx ts-node manage-admin.ts add --phone 13800000000');
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`ℹ️  用户「${user.nickname || user.phone || user.email}」已经是管理员。`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });

  console.log('✅ 管理员添加成功！');
  console.log(`   用户: ${user.nickname || '(未设置昵称)'}`);
  console.log(`   手机: ${user.phone || '(未绑定)'}`);
  console.log(`   邮箱: ${user.email || '(未绑定)'}`);
  console.log(`   ID:   ${user.id}`);
  console.log(`   角色: ${user.role} → admin`);
}

async function removeAdmin(args: string[]) {
  const user = await findUser(args);

  if (!user) {
    console.error('❌ 用户不存在。');
    process.exit(1);
  }

  if (user.role !== 'admin') {
    console.log(`ℹ️  用户「${user.nickname || user.phone || user.email}」不是管理员（当前角色: ${user.role}）。`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'user' },
  });

  console.log('✅ 管理员权限已移除。');
  console.log(`   用户: ${user.nickname || '(未设置昵称)'}`);
  console.log(`   角色: admin → user`);
}

async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: {
      id: true,
      nickname: true,
      phone: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (admins.length === 0) {
    console.log('ℹ️  当前没有管理员。');
    return;
  }

  console.log(`📋 当前管理员列表（共 ${admins.length} 人）：\n`);
  console.log('序号  昵称              手机           邮箱                    注册时间');
  console.log('─'.repeat(90));

  admins.forEach((admin, index) => {
    const nickname = (admin.nickname || '(未设置)').padEnd(16);
    const phone = (admin.phone || '(未绑定)').padEnd(14);
    const email = (admin.email || '(未绑定)').padEnd(24);
    const date = admin.createdAt.toISOString().split('T')[0];
    console.log(`${String(index + 1).padStart(2)}    ${nickname}${phone}${email}${date}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('管理员资格管理工具\n');
    console.log('用法:');
    console.log('  npx ts-node manage-admin.ts add --phone <手机号>      添加管理员');
    console.log('  npx ts-node manage-admin.ts add --email <邮箱>        添加管理员');
    console.log('  npx ts-node manage-admin.ts add --id <用户ID>         添加管理员');
    console.log('  npx ts-node manage-admin.ts remove --phone <手机号>   移除管理员');
    console.log('  npx ts-node manage-admin.ts remove --email <邮箱>     移除管理员');
    console.log('  npx ts-node manage-admin.ts list                      查看所有管理员');
    process.exit(0);
  }

  try {
    switch (command) {
      case 'add':
        await addAdmin(args);
        break;
      case 'remove':
        await removeAdmin(args);
        break;
      case 'list':
        await listAdmins();
        break;
      default:
        console.error(`❌ 未知命令: ${command}`);
        console.error('   支持的命令: add, remove, list');
        process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ 执行失败:', error.message);
  prisma.$disconnect();
  process.exit(1);
});
