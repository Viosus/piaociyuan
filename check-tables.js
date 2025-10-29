const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(DB_PATH);

console.log('数据库路径:', DB_PATH);
console.log('\n所有表名:');

const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table'
  ORDER BY name
`).all();

tables.forEach(t => {
  console.log(`  - ${t.name}`);
  
  // 查看表结构
  const info = db.prepare(`PRAGMA table_info("${t.name}")`).all();
  console.log(`    字段: ${info.map(i => i.name).join(', ')}`);
});

db.close();