/**
 * 关注相关 API 服务
 */

import { apiClient } from './api';

// 用户类型
export interface User {
  id: number;
  phone?: string;
  email?: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin' | 'celebrity' | 'artist' | 'organizer' | 'official';
  isVerified: boolean;
  verificationData?: {
    type: string;
    organization?: string;
  };
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  nftsCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  createdAt: string;
}

// 关注列表响应
export interface FollowListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 关注用户
 */
export async function followUser(userId: number) {
  return apiClient.post(`/api/users/${userId}/follow`);
}

/**
 * 取消关注用户
 */
export async function unfollowUser(userId: number) {
  return apiClient.delete(`/api/users/${userId}/follow`);
}

/**
 * 获取用户的关注列表
 */
export async function getFollowing(userId: number, page: number = 1, limit: number = 20) {
  return apiClient.get<FollowListResponse>(`/api/users/${userId}/following`, {
    params: { page, limit },
    cache: false,
  });
}

/**
 * 获取用户的粉丝列表
 */
export async function getFollowers(userId: number, page: number = 1, limit: number = 20) {
  return apiClient.get<FollowListResponse>(`/api/users/${userId}/followers`, {
    params: { page, limit },
    cache: false,
  });
}

/**
 * 获取用户详细信息
 */
export async function getUserProfile(userId: number) {
  return apiClient.get<User>(`/api/users/${userId}`, {
    cache: true,
    cacheTime: 60000, // 缓存 1 分钟
  });
}

/**
 * 搜索用户
 */
export async function searchUsers(keyword: string, page: number = 1, limit: number = 20) {
  return apiClient.get<User[]>('/api/users/search', {
    params: { keyword, page, limit },
    cache: false,
  });
}
