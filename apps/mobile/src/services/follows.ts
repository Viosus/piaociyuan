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
  postCount?: number;
  nftCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  createdAt: string;
}

// 关注列表响应
export interface FollowListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
