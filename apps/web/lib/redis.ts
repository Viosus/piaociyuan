// lib/redis.ts
// Redis 单例（用于登录退避、限流等需要跨进程/跨重启共享的状态）

import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function buildRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    });
  }

  const host = process.env.REDIS_HOST || 'redis';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD;
  return new Redis({
    host,
    port,
    password,
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  });
}

export const redis = globalForRedis.redis ?? buildRedis();

redis.on('error', (err) => {
  console.error('[Redis] connection error:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;
