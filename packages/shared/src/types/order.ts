// Order 相关类型
// 对应 Prisma schema 中的 model Order（apps/web/prisma/schema.prisma:78）
// 注意：Order.id 是自定义 String（不是 UUID 也不是 Int）
// Order.eventId/tierId 在数据库里**也是 String**——这是历史包袱（schema 注释说"在代码中处理类型转换"）

export type OrderStatusValue = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'wechat' | 'alipay' | 'mock';

export interface Order {
  id: string;
  userId: string;
  eventId: string;             // 注意：DB 里是 String（schema 历史包袱）
  tierId: string;              // 注意：DB 里是 String（schema 历史包袱）
  qty: number;
  holdId: string;
  status: string;
  createdAt: number;           // BigInt → number（毫秒时间戳）
  paidAt: number | null;

  paymentMethod: string | null;
  transactionId: string | null;
  refundedAt: number | null;
  refundId: string | null;
}

/**
 * 订单 + 关联数据（API 返回时常带 event/tier/tickets 信息）
 */
export interface OrderWithDetails extends Order {
  event?: {
    id: number;
    name: string;
    cover: string;
    date: string;
    time: string;
    venue: string;
  };
  tier?: {
    id: number;
    name: string;
    price: number;
  };
}
