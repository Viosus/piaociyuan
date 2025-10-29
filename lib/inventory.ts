// lib/inventory.ts
// 修复内容：
// 1. 添加 createHoldWithLock 乐观锁机制（防止并发超卖）
// 2. getTierCapacity 修复为直接从 mockTiers 读取 remaining
// 3. 增强参数校验函数
// 4. 优化错误提示信息

import { holdsMap, ordersMap, Hold, normalizeId } from "./store";
import { mockEvents, mockTiers } from "./mock";

// ✅ 惰性清理过期 hold
export function purgeExpiredHolds(nowMs: number): number {
  let purged = 0;
  for (const [id, hold] of holdsMap) {
    if (hold.expireAt <= nowMs) {
      holdsMap.delete(id);
      purged++;
    }
  }
  return purged;
}

// ✅ 获取活跃锁票数量
export function getActiveHoldQty(
  eventId: string,
  tierId: string,
  nowMs: number
): number {
  let sum = 0;
  for (const hold of holdsMap.values()) {
    if (
      hold.eventId === eventId &&
      hold.tierId === tierId &&
      hold.expireAt > nowMs
    ) {
      sum += hold.qty;
    }
  }
  return sum;
}

// ✅ 获取已支付数量
export function getPaidQty(eventId: string, tierId: string): number {
  let sum = 0;
  for (const order of ordersMap.values()) {
    if (
      order.eventId === eventId &&
      order.tierId === tierId &&
      order.status === "PAID"
    ) {
      sum += order.qty;
    }
  }
  return sum;
}

// ✅✅ 修复：直接从 mockTiers 读取 remaining（针对您的数据结构）
export function getTierCapacity(eventId: string, tierId: string): number {
  console.log(`[getTierCapacity] 查询 eventId=${eventId}, tierId=${tierId}`);
  
  // 直接从 mockTiers 查找
  const tier = mockTiers.find((t: any) => 
    String(t.id) === String(tierId) && 
    String(t.eventId) === String(eventId)
  );
  
  if (!tier) {
    console.error(
      `[CAPACITY_ERROR] ❌ 未找到票档`,
      `eventId=${eventId}, tierId=${tierId}`,
      `当前 mockTiers 包含的票档:`,
      mockTiers.map(t => `eventId=${t.eventId}, tierId=${t.id}, name=${t.name}`)
    );
    throw new ApiError(
      404,
      "TIER_NOT_FOUND",
      "票档不存在，请返回活动页重新选择"
    );
  }
  
  // 读取 remaining 字段作为容量
  const capacity = tier.remaining;
  
  console.log(
    `[getTierCapacity] ✅ 找到票档 "${tier.name}"`,
    `容量=${capacity}`,
    `价格=¥${tier.price}`
  );
  
  return capacity;
}

// ✅ 计算可售数量
export function getAvailableQty(
  eventId: string,
  tierId: string,
  nowMs: number
): number {
  const cap = getTierCapacity(eventId, tierId);
  const paid = getPaidQty(eventId, tierId);
  const activeHolds = getActiveHoldQty(eventId, tierId, nowMs);
  const available = cap - paid - activeHolds;
  
  console.log(
    `[getAvailableQty] 计算结果:`,
    `总容量=${cap}, 已售=${paid}, 锁票=${activeHolds}, 可售=${available}`
  );
  
  return Math.max(0, available);
}

// ✅ 新增：带乐观锁的 hold 创建（防止并发超卖）
export function createHoldWithLock(
  eventId: string,
  tierId: string,
  qty: number,
  nowMs: number
): { holdId: string; expireAt: number } | null {
  // 生成临时 holdId
  const holdId = `H_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const HOLD_MS = 10 * 60 * 1000; // 10 分钟
  const expireAt = nowMs + HOLD_MS;

  // 1️⃣ 先创建 hold（占位）
  holdsMap.set(holdId, {
    holdId,
    eventId,
    tierId,
    qty,
    createdAt: nowMs,
    expireAt,
  });

  // 2️⃣ 再次检查可售数量（乐观锁：检测其他并发请求）
  const available = getAvailableQty(eventId, tierId, nowMs);

  if (qty > available) {
    // 库存不足，回滚 hold
    holdsMap.delete(holdId);
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

// ✅ 增强：参数校验
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