// prisma/env-load.js
require('dotenv').config();
console.log('✅ 环境变量已加载');
console.log('DATABASE_URL:', process.env.DATABASE_URL);