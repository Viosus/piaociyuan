// scripts/view-postgres-users.js
// 查看 PostgreSQL 中的用户数据

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('👥 查看 PostgreSQL 中的所有用户：\n');

  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('📊 数据库中暂无用户，请先注册一个账号！\n');
      console.log('访问：http://localhost:3000/auth/register\n');
      return;
    }

    console.log(`📊 共有 ${users.length} 个用户\n`);

    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  邮箱: ${user.email || '无'}`);
      console.log(`  手机: ${user.phone || '无'}`);
      console.log(`  昵称: ${user.nickname}`);
      console.log(`  登录方式: ${user.authProvider}`);
      console.log(`  注册时间: ${user.createdAt.toLocaleString('zh-CN')}`);
      console.log('');
    });

    // 统计登录日志
    const loginLogs = await prisma.loginLog.count();
    console.log(`📝 登录日志数: ${loginLogs}`);

    // 统计活跃会话
    const activeSessions = await prisma.userSession.count({
      where: {
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    console.log(`🔐 活跃会话数: ${activeSessions}`);

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
