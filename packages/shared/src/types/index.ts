// 共享类型定义入口

/**
 * API 响应通用格式
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 用户角色 enum（保留向后兼容）
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * 票据状态 enum（保留向后兼容）
 */
export enum TicketStatus {
  AVAILABLE = 'available',
  HELD = 'held',
  SOLD = 'sold',
  USED = 'used',
  REFUNDED = 'refunded',
}

/**
 * 订单状态 enum（保留向后兼容）
 */
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * 通知类型 enum（保留向后兼容）
 */
export enum NotificationType {
  SYSTEM = 'system',
  ORDER = 'order',
  EVENT = 'event',
  SOCIAL = 'social',
}

// ==================== 业务实体类型 ====================
// 严格对齐 apps/web/prisma/schema.prisma；DateTime 序列化为 ISO 字符串

export * from './user';
export * from './event';
export * from './ticket';
export * from './order';
export * from './message';
export * from './notification';
export * from './collectible';
export * from './post';
