/**
 * 门票相关 API 服务
 */

import { apiClient } from './api';

// 门票类型定义
export interface Ticket {
  id: number;
  ticketCode: string;
  eventId: number;
  tierId: number;
  userId: number;
  orderId: number;
  seatNumber?: string;
  price: number;
  status: 'available' | 'sold' | 'used' | 'refunded';
  usedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
    venue: string;
    startTime: string;
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
  return apiClient.get<Ticket[]>('/api/user/tickets', {
    params: {
      status: params.status,
      page: params.page || 1,
      limit: params.limit || 20,
    },
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

/**
 * 转赠门票
 */
export async function transferTicket(ticketId: string | number, targetUserId: number) {
  return apiClient.post(`/api/tickets/${ticketId}/transfer`, {
    targetUserId,
  });
}
