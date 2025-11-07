import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * 订单相关的 API
 */

export interface Order {
  id: number;
  userId: number;
  eventId: number;
  tierId: number;
  qty: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  createdAt: string;
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

export interface Ticket {
  id: number;
  ticketCode: string;
  orderId: number;
  eventId: number;
  tierId: number;
  userId: number;
  status: 'available' | 'held' | 'sold' | 'used' | 'refunded';
  price: number;
  createdAt: string;
  usedAt?: string;
  refundedAt?: string;
  event?: {
    id: number;
    name: string;
    venue: string;
    startTime: string;
    coverImage?: string;
  };
  tier?: {
    name: string;
  };
}

/**
 * 创建订单
 */
export async function createOrder(data: {
  eventId: number;
  tierId: number;
  qty: number;
}): Promise<ApiResponse<Order>> {
  return apiClient.post<Order>('/api/orders', data);
}

/**
 * 获取我的订单列表
 */
export async function getMyOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<Order[]>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const queryString = query.toString();
  return apiClient.get<Order[]>(`/api/orders/my${queryString ? `?${queryString}` : ''}`);
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(orderId: number): Promise<ApiResponse<Order>> {
  return apiClient.get<Order>(`/api/orders/${orderId}`);
}

/**
 * 支付订单
 */
export async function payOrder(orderId: number): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>(`/api/orders/${orderId}/pay`);
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId: number): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>(`/api/orders/${orderId}/cancel`);
}

/**
 * 申请退款
 */
export async function refundOrder(orderId: number): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.post<{ success: boolean }>(`/api/orders/${orderId}/refund`);
}

/**
 * 获取我的门票
 */
export async function getMyTickets(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<Ticket[]>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const queryString = query.toString();
  return apiClient.get<Ticket[]>(`/api/tickets/my${queryString ? `?${queryString}` : ''}`);
}

/**
 * 获取门票详情
 */
export async function getTicketDetail(ticketId: number): Promise<ApiResponse<Ticket>> {
  return apiClient.get<Ticket>(`/api/tickets/${ticketId}`);
}
