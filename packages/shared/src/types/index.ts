// 共享类型定义

/**
 * API 响应通用格式
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
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
 * 用户角色
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * 票据状态
 */
export enum TicketStatus {
  AVAILABLE = 'available',   // 可售
  HELD = 'held',              // 锁定中
  SOLD = 'sold',              // 已售出
  USED = 'used',              // 已使用
  REFUNDED = 'refunded',      // 已退款
}

/**
 * 订单状态
 */
export enum OrderStatus {
  PENDING = 'pending',        // 待支付
  PAID = 'paid',              // 已支付
  CANCELLED = 'cancelled',    // 已取消
  REFUNDED = 'refunded',      // 已退款
}

/**
 * NFT 类别
 */
export enum NFTCategory {
  TICKET = 'ticket',          // 票据类NFT
  BADGE = 'badge',            // 徽章类NFT
  COMMEMORATIVE = 'commemorative', // 纪念类NFT
}

/**
 * NFT 稀有度
 */
export enum NFTRarity {
  COMMON = 'common',          // 普通
  RARE = 'rare',              // 稀有
  EPIC = 'epic',              // 史诗
  LEGENDARY = 'legendary',    // 传说
}

/**
 * NFT 来源类型
 */
export enum NFTSourceType {
  PURCHASE = 'purchase',      // 购买获得
  AIRDROP = 'airdrop',        // 空投获得
  ACHIEVEMENT = 'achievement', // 成就获得
}

/**
 * 通知类型
 */
export enum NotificationType {
  SYSTEM = 'system',          // 系统通知
  ORDER = 'order',            // 订单通知
  EVENT = 'event',            // 活动通知
  NFT = 'nft',                // NFT通知
  SOCIAL = 'social',          // 社交通知
}
