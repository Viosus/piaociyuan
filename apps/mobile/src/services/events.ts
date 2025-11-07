import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * 活动相关的 API
 */

export interface Event {
  id: number;
  name: string;
  description?: string;
  venue: string;
  startTime: string;
  endTime: string;
  coverImage?: string;
  category?: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
}

export interface EventDetail extends Event {
  tiers: Tier[];
}

export interface Tier {
  id: number;
  eventId: number;
  name: string;
  price: number;
  capacity: number;
  available: number;
  description?: string;
}

/**
 * 获取活动列表
 */
export async function getEvents(params?: {
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<Event[]>> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const queryString = query.toString();
  return apiClient.get<Event[]>(`/api/events${queryString ? `?${queryString}` : ''}`);
}

/**
 * 获取活动详情
 */
export async function getEventDetail(eventId: number): Promise<ApiResponse<EventDetail>> {
  return apiClient.get<EventDetail>(`/api/events/${eventId}`);
}

/**
 * 搜索活动
 */
export async function searchEvents(keyword: string): Promise<ApiResponse<Event[]>> {
  return apiClient.get<Event[]>(`/api/events/search?q=${encodeURIComponent(keyword)}`);
}
