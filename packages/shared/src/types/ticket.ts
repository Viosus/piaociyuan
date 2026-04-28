// Ticket 相关类型
// 对应 Prisma schema 中的 model Ticket（apps/web/prisma/schema.prisma:107）

export type TicketStatusValue = 'available' | 'held' | 'sold' | 'used' | 'refunded';

export interface Ticket {
  id: string;                  // UUID
  ticketCode: string;
  seatNumber: string | null;
  eventId: number;             // ref Event.id (Int)
  tierId: number;              // ref Tier.id (Int)
  holdId: string | null;
  orderId: string | null;
  userId: string | null;
  status: string;
  price: number;               // 单位：分

  purchasedAt: string | null;
  usedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 票券转让记录（model TicketTransfer）
 */
export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type TransferType = 'gift' | 'sale';

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string | null;
  toUserPhone: string | null;
  toUserEmail: string | null;
  transferCode: string;
  message: string | null;
  transferType: string;
  price: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}
