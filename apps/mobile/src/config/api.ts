// API 配置
// 开发环境使用本地 API，生产环境使用实际域名
export const API_URL = __DEV__
  ? 'http://localhost:3000/api' // 开发环境
  : 'https://your-production-domain.com/api'; // 生产环境，需要替换为实际域名
