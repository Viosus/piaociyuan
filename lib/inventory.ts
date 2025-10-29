// lib/inventory.ts
import { getDB } from "./database";
import { normalizeId } from "./store";

// ✅ 清理过期 hold
export async function purgeExpiredHolds(nowMs: number): Promise<number> {
  const db = getDB();
  const result = db.prepare('DELETE FROM holds WHERE CAST(expireAt AS INTEGER) <= ?').run(nowMs);
  return result.changes;
}

// ✅ 获取活跃锁票数量
export async function getActiveHoldQty(
  eventId: string,
  tierId: string,
  nowMs: number
): Promise<number> {
  const db = getDB();
  const result = db.prepare(`
    SELECT COALESCE(SUM(qty), 0) as total
    FROM holds
    WHERE eventId = ? AND tierId = ? AND CAST(expireAt AS INTEGER) > ?
  `).get(eventId, tierId, nowMs) as { total: number };
  
  return result.total;
}

// ✅ 获取已支付数量
export async function getPaidQty(eventId: string, tierId: string): Promise<number> {
  const db = getDB();
  const result = db.prepare(`
    SELECT COALESCE(SUM(qty), 0) as total
    FROM orders
    WHERE eventId = ? AND tierId = ? AND status = 'PAID'
  `).get(eventId, tierId) as { total: number };
  
  return result.total;
}

// ✅ 获取票档容量
export async function getTierCapacity(eventId: string, tierId: string): Promise<number> {
  console.log(`[getTierCapacity] 查询 eventId=${eventId}, tierId=${tierId}`);
  
  const db = getDB();
  const tier = db.prepare(`
    SELECT * FROM tiers
    WHERE id = ? AND eventId = ?
  `).get(Number(tierId), Number(eventId)) as any;
  
  if (!tier) {
    console.error(`[CAPACITY_ERROR] ❌ 未找到票档 eventId=${eventId}, tierId=${tierId}`);
    throw new ApiError(404, "TIER_NOT_FOUND", "票档不存在，请返回活动页重新选择");
  }
  
  console.log(
    `[getTierCapacity] ✅ 找到票档 "${tier.name}"`,
    `容量=${tier.capacity}`,
    `价格=¥${tier.price}`
  );
  
  return tier.capacity;
}

// ✅ 计算可售数量
export async function getAvailableQty(
  eventId: string,
  tierId: string,
  nowMs: number
): Promise<number> {
  const cap = await getTierCapacity(eventId, tierId);
  const paid = await getPaidQty(eventId, tierId);
  const activeHolds = await getActiveHoldQty(eventId, tierId, nowMs);
  const available = cap - paid - activeHolds;
  
  console.log(
    `[getAvailableQty] 计算结果:`,
    `总容量=${cap}, 已售=${paid}, 锁票=${activeHolds}, 可售=${available}`
  );
  
  return Math.max(0, available);
}

// ✅ 创建 hold（带乐观锁）
export async function createHoldWithLock(
  eventId: string,
  tierId: string,
  qty: number,
  nowMs: number
): Promise<{ holdId: string; expireAt: number } | null> {
  const holdId = `H_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const HOLD_MS = 10 * 60 * 1000; // 10 分钟
  const expireAt = nowMs + HOLD_MS;

  const db = getDB();
  
  // 1️⃣ 先创建 hold（占位）
  db.prepare(`
    INSERT INTO holds (id, eventId, tierId, qty, createdAt, expireAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(holdId, eventId, tierId, qty, nowMs.toString(), expireAt.toString());

  // 2️⃣ 再次检查可售数量（乐观锁）
  const available = await getAvailableQty(eventId, tierId, nowMs);

  if (qty > available) {
    // 库存不足，回滚 hold
    db.prepare('DELETE FROM holds WHERE id = ?').run(holdId);
    console.warn(
      `[HOLD_REJECT] 并发冲突或库存不足`,
      `eventId=${eventId}, tierId=${tierId}`,
      `请求=${qty}, 可售=${available}`
    );
    return null;
  }

  // 3️⃣ 成功创建
  console.log(
    `[HOLD_CREATE] ✅ 创建成功`,
    `holdId=${holdId}`,
    `eventId=${eventId}, tierId=${tierId}`,
    `qty=${qty}`,
    `过期时间=${new Date(expireAt).toLocaleString()}`
  );
  return { holdId, expireAt };
}

// ✅ 参数校验
export function assertPositiveInt(qty: any, maxQty: number = 10) {
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) {
    throw new ApiError(400, "INVALID_QTY", "购买数量必须为正整数");
  }

  if (qty > maxQty) {
    throw new ApiError(
      400,
      "QTY_LIMIT_EXCEEDED",
      `单次最多购买 ${maxQty} 张`
    );
  }
}

// ✅ 统一错误类
export class ApiError extends Error {
  status: number;
  code: string;
  data?: any;

  constructor(status: number, code: string, message: string, data?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
    this.name = "ApiError";
  }
}