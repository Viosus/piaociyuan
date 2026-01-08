/**
 * 门票相关 API 服务
 */

import { apiClient } from './api';

// 门票类型定义
export interface Ticket {
  id: string;
  ticketCode: string;
  eventId: number;
  tierId: number;
  userId?: string;
  orderId?: string;
  seatNumber?: string;
  price: number;
  status: 'available' | 'sold' | 'used' | 'refunded';
  purchasedAt?: string;
  usedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
    city?: string;
    venue: string;
    date?: string;
    time?: string;
    startTime?: string;
    cover?: string;
    coverImage?: string;
  };
  tier?: {
    id: number;
    name: string;
    price: number;
  };
}

// 获取我的门票参数
export interface GetMyTicketsParams {
  status?: 'available' | 'sold' | 'used' | 'refunded';
  page?: number;
  limit?: number;
}

/**
 * 获取我的门票列表
 */
export async function getMyTickets(params: GetMyTicketsParams = {}) {
  // 构建 query string
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/tickets/my-tickets${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<Ticket[]>(endpoint, {
    cache: false,
  });
}

/**
 * 获取门票详情
 */
export async function getTicketDetail(ticketId: string | number) {
  return apiClient.get<Ticket>(`/api/tickets/${ticketId}`, {
    cache: false,
  });
}

/**
 * 退票
 */
export async function refundTicket(ticketId: string | number) {
  return apiClient.post(`/api/tickets/${ticketId}/refund`);
}

/**
 * 验票
 */
export async function verifyTicket(ticketCode: string) {
  return apiClient.post<{ status: string; ticket?: Ticket }>('/api/tickets/verify', {
    ticketCode,
  });
}

// ==================== 票务转让功能 ====================

// 转让记录类型
export interface TicketTransfer {
  id: string;
  transferCode: string;
  transferType: 'gift' | 'sale';
  price?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  ticket?: {
    id: string;
    ticketCode: string;
    price: number;
    seatNumber?: string;
  };
  event?: {
    id: number;
    name: string;
    date: string;
    venue: string;
    cover?: string;
  };
  tier?: {
    id: number;
    name: string;
    price: number;
  };
  fromUser?: {
    id: string;
    nickname?: string;
    avatar?: string;
    isVerified?: boolean;
    verifiedType?: string;
  };
  toUser?: {
    id: string;
    nickname?: string;
    avatar?: string;
  };
  // NFT 相关信息
  hasNFT?: boolean;
  nft?: {
    userNftId: string;
    nft?: {
      id: string;
      name: string;
      imageUrl?: string;
      rarity?: string;
      description?: string;
    };
    isOnChain?: boolean;
    mintStatus?: string;
  };
}

// 发起转让参数
export interface CreateTransferParams {
  ticketId: string;
  transferType?: 'gift' | 'sale';
  price?: number;
  message?: string;
  toUserPhone?: string;
  toUserEmail?: string;
  expiresInHours?: number;
}

/**
 * 发起门票转让/赠送
 */
export async function createTicketTransfer(params: CreateTransferParams) {
  return apiClient.post<{
    id: string;
    transferCode: string;
    transferType: string;
    price?: number;
    message?: string;
    expiresAt: string;
    status: string;
  }>('/api/tickets/transfer', params);
}

/**
 * 获取我的转让记录
 */
export async function getMyTransfers(params: {
  type?: 'sent' | 'received';
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/tickets/transfer${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<TicketTransfer[]>(endpoint);
}

/**
 * 通过转让码获取转让详情
 */
export async function getTransferByCode(code: string) {
  return apiClient.get<TicketTransfer>(`/api/tickets/transfer/${code}`);
}

/**
 * 接收门票转让
 */
export async function acceptTransfer(transferCode: string, action: 'accept' | 'reject' = 'accept') {
  return apiClient.post<{
    transferId: string;
    ticket?: {
      id: string;
      ticketCode: string;
      price: number;
    };
    event?: {
      id: number;
      name: string;
      date: string;
      venue: string;
      cover?: string;
    };
  }>('/api/tickets/transfer/accept', {
    transferCode,
    action,
  });
}

/**
 * 取消门票转让
 */
export async function cancelTransfer(transferId: string) {
  return apiClient.post('/api/tickets/transfer/cancel', {
    transferId,
  });
}
