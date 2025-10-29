// lib/store.ts
// 修复内容：
// 1. 统一 ID 类型为 string
// 2. 添加 normalizeId 工具函数
// 3. 添加定时清理任务
// 4. 添加订单清理逻辑

export type OrderStatus = "PENDING" | "PAID";

export interface Hold {
  holdId: string;
  eventId: string;
  tierId: string;
  qty: number;
  expireAt: number; // ms timestamp
  createdAt: number;
}

export interface Order {
  orderId: string;
  eventId: string;
  tierId: string;
  qty: number;
  status: OrderStatus;
  createdAt: number;
  paidAt?: number | null;
  holdId: string;
}

// 使用 globalThis 确保 dev 热重载后仍复用同一引用
const g = globalThis as any;

if (!g.__PYZ_HOLDS__) {
  g.__PYZ_HOLDS__ = new Map<string, Hold>();
}
if (!g.__PYZ_ORDERS__) {
  g.__PYZ_ORDERS__ = new Map<string, Order>();
}

export const holdsMap: Map<string, Hold> = g.__PYZ_HOLDS__;
export const ordersMap: Map<string, Order> = g.__PYZ_ORDERS__;

export function genId(prefix: string = "ID"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

// ✅ 新增：统一 ID 规范化函数
export function normalizeId(id: number | string | null | undefined): string {
  if (id == null) {
    throw new Error("ID 不能为空");
  }
  return String(id).trim();
}

// ✅ 新增：定时清理任务（仅在服务器环境运行）
if (typeof setInterval !== "undefined" && typeof process !== "undefined") {
  // 防止多次初始化
  if (!g.__PYZ_CLEANUP_STARTED__) {
    g.__PYZ_CLEANUP_STARTED__ = true;

    // 每分钟清理过期 hold
    setInterval(() => {
      const now = Date.now();
      let purgedHolds = 0;

      for (const [id, hold] of holdsMap) {
        if (hold.expireAt <= now) {
          holdsMap.delete(id);
          purgedHolds++;
        }
      }

      if (purgedHolds > 0) {
        console.log(`[CLEANUP] 清理了 ${purgedHolds} 个过期锁票`);
      }

      // 清理 30 天前的已支付订单（防止内存泄漏）
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      let purgedOrders = 0;

      for (const [id, order] of ordersMap) {
        if (
          order.status === "PAID" &&
          order.paidAt &&
          now - order.paidAt > THIRTY_DAYS
        ) {
          ordersMap.delete(id);
          purgedOrders++;
        }
      }

      if (purgedOrders > 0) {
        console.log(`[CLEANUP] 清理了 ${purgedOrders} 个旧订单`);
      }

      // 输出统计信息
      console.log(`[METRICS] holds=${holdsMap.size}, orders=${ordersMap.size}`);
    }, 60 * 1000); // 每分钟执行一次

    console.log("[STORE] 定时清理任务已启动");
  }
}