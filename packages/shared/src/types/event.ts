// Event / Tier 相关类型
// 对应 Prisma schema 中的 model Event（apps/web/prisma/schema.prisma:12）和 model Tier（:45）
// 注意：Event.id 和 Tier.id 是 Int（autoincrement），不是 UUID

export type EventCategory =
  | 'concert'
  | 'festival'
  | 'exhibition'
  | 'musicale'
  | 'show'
  | 'sports'
  | 'other';

export type SaleStatus =
  | 'not_started'
  | 'on_sale'
  | 'paused'
  | 'sold_out'
  | 'ended';

export interface Event {
  id: number;                  // autoincrement int
  name: string;
  category: string;
  city: string;
  venue: string;
  date: string;                // 演出日期（字符串）
  time: string;                // 演出时间（字符串）

  saleStatus: string;
  saleStartTime: string;       // ISO
  saleEndTime: string;         // ISO

  cover: string;
  artist: string;
  desc: string;

  createdAt: string;
  updatedAt: string;

  // 可能附带的关联数据（按需）
  tiers?: Tier[];
}

export interface Tier {
  id: number;                  // autoincrement int
  eventId: number;
  name: string;
  price: number;               // 单位：分
  capacity: number;
  remaining: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
}
