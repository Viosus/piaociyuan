// scripts/create-verification-table.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(DB_PATH);

console.log('🔧 创建验证码表...');

try {
  // 创建验证码表
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(email);
    CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_codes(expiresAt);
  `);

  console.log('✅ verification_codes 表创建成功！');

  // 查看表结构
  const schema = db.prepare(`PRAGMA table_info(verification_codes)`).all();
  console.log('📐 验证码表结构：');
  schema.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

} catch (error) {
  console.error('❌ 创建失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}
