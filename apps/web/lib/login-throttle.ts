// lib/login-throttle.ts
// 账号级登录失败退避：5 次后锁定 1 分钟，每多一次错误翻倍，封顶 30 分钟。
// 状态存 Redis；Redis 出问题时降级为放行（绝不阻塞合法登录）。

import { createHash } from 'crypto';
import redis from './redis';

const THRESHOLD = 5;
// 单位：秒。1 → 2 → 4 → 8 → 16 → 30 分钟封顶
const STAGES_SEC = [60, 120, 240, 480, 960, 1800];
// 失败计数 key 自身的 TTL，避免单次错误永远堆积
const FAIL_COUNTER_TTL_SEC = 60 * 60 * 24;

function hashAccount(account: string): string {
  return createHash('sha256').update(account.trim().toLowerCase()).digest('hex').slice(0, 32);
}

function failKey(accountHash: string) {
  return `login:fail:${accountHash}`;
}
function lockKey(accountHash: string) {
  return `login:lock:${accountHash}`;
}

export type LoginGate =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export type LoginFailureResult =
  | { locked: false; attemptsLeft: number }
  | { locked: true; retryAfterSec: number };

export async function checkLoginAllowed(account: string): Promise<LoginGate> {
  try {
    const ttl = await redis.ttl(lockKey(hashAccount(account)));
    if (ttl > 0) return { allowed: false, retryAfterSec: ttl };
    return { allowed: true };
  } catch (err) {
    console.error('[login-throttle] checkLoginAllowed degraded:', (err as Error).message);
    return { allowed: true };
  }
}

export async function recordLoginFailure(account: string): Promise<LoginFailureResult> {
  try {
    const h = hashAccount(account);
    const fk = failKey(h);
    const count = await redis.incr(fk);
    if (count === 1) {
      await redis.expire(fk, FAIL_COUNTER_TTL_SEC);
    }

    if (count >= THRESHOLD) {
      const stageIdx = Math.min(count - THRESHOLD, STAGES_SEC.length - 1);
      const lockSec = STAGES_SEC[stageIdx];
      await redis.set(lockKey(h), '1', 'EX', lockSec);
      return { locked: true, retryAfterSec: lockSec };
    }

    return { locked: false, attemptsLeft: THRESHOLD - count };
  } catch (err) {
    console.error('[login-throttle] recordLoginFailure degraded:', (err as Error).message);
    return { locked: false, attemptsLeft: THRESHOLD };
  }
}

export async function clearLoginFailures(account: string): Promise<void> {
  try {
    const h = hashAccount(account);
    await redis.del(failKey(h), lockKey(h));
  } catch (err) {
    console.error('[login-throttle] clearLoginFailures degraded:', (err as Error).message);
  }
}

export function formatRetryAfter(sec: number): string {
  if (sec < 60) return `${sec} 秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} 分 ${s} 秒` : `${m} 分钟`;
}
