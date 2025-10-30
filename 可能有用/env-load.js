/**
 * 原始位置：C:\piaoyuzhou\prisma\env-load.js
 * 用途：调试脚本 - 测试环境变量加载
 * 功能：加载 .env 文件并打印 DATABASE_URL
 * 使用方法：node prisma/env-load.js
 */

// prisma/env-load.js
require('dotenv').config();
console.log('✅ 环境变量已加载');
console.log('DATABASE_URL:', process.env.DATABASE_URL);