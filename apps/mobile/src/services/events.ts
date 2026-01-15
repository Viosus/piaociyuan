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
  city?: string;
  date?: string;
  time?: string;
  startTime: string;
  endTime: string;
  coverImage?: string;
  cover?: string;
  category?: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
  // 价格信息
  minPrice?: number | null;
  maxPrice?: number | null;
  // NFT信息
  hasNft?: boolean;
  nftCount?: number;
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

// 活动筛选参数类型
export interface EventFilters {
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  // 日期范围
  dateFrom?: string;
  dateTo?: string;
  // 价格范围
  minPrice?: number;
  maxPrice?: number;
  // 是否有NFT纪念品
  hasNft?: boolean;
  // 排序
  sortBy?: 'date' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取活动列表
 */
export async function getEvents(params?: EventFilters): Promise<ApiResponse<Event[]>> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  // 日期范围
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  // 价格范围
  if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
  // NFT筛选
  if (params?.hasNft !== undefined) query.append('hasNft', params.hasNft.toString());
  // 排序
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

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
