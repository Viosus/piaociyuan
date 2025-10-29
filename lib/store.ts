// lib/store.ts
// 工具函数模块（数据库版本）

export type OrderStatus = "PENDING" | "PAID";

// ✅ 生成唯一 ID
export function genId(prefix: string = "ID"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

// ✅ 统一 ID 规范化函数
export function normalizeId(id: number | string | null | undefined): string {
  if (id == null) {
    throw new Error("ID 不能为空");
  }
  return String(id).trim();
}