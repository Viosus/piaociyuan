// scripts/view-users.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(DB_PATH);

console.log('👥 查看所有注册用户：\n');

try {
  const users = db.prepare('SELECT * FROM users').all();

  if (users.length === 0) {
    console.log('📭 还没有注册用户');
  } else {
    console.log(`📊 共有 ${users.length} 个用户\n`);

    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  邮箱: ${user.email || '无'}`);
      console.log(`  手机: ${user.phone || '无'}`);
      console.log(`  昵称: ${user.nickname || '无'}`);
      console.log(`  登录方式: ${user.authProvider}`);
      console.log(`  注册时间: ${user.createdAt}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('❌ 查询失败:', error.message);
} finally {
  db.close();
}
