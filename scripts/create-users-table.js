// scripts/create-users-table.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(DB_PATH);

console.log('🔧 创建 users 表...');

try {
  // 创建 users 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      wechatOpenId TEXT UNIQUE,
      qqOpenId TEXT UNIQUE,
      authProvider TEXT NOT NULL DEFAULT 'local',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_wechatOpenId ON users(wechatOpenId);
    CREATE INDEX IF NOT EXISTS idx_users_qqOpenId ON users(qqOpenId);
  `);

  console.log('✅ users 表创建成功！');

  // 检查表是否存在
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='users'
  `).all();

  console.log('📋 当前表：', tables);

  // 查看表结构
  const schema = db.prepare(`PRAGMA table_info(users)`).all();
  console.log('📐 users 表结构：');
  schema.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

} catch (error) {
  console.error('❌ 创建失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}
