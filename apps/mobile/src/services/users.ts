/**
 * 用户相关 API 服务
 */

import { apiClient } from './api';

/**
 * 用户信息接口
 */
export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  verifiedType?: 'celebrity' | 'artist' | 'organizer' | 'official';
  walletAddress?: string;
  createdAt: string;

  // 统计数据
  stats?: {
    postCount: number;
    followingCount: number;
    followerCount: number;
    nftCount: number;
  };

  // 关系状态
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

/**
 * 关注用户数据
 */
export interface FollowUser {
  id: string;
  nickname: string;
  avatar?: string;
  isVerified: boolean;
  bio?: string;
  isFollowing?: boolean;
}

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string) {
  return apiClient.get<UserProfile>(`/api/user/${userId}`);
}

/**
 * 获取当前用户资料
 */
export async function getMyProfile() {
  return apiClient.get<UserProfile>('/api/user/me');
}

/**
 * 更新用户资料
 */
export async function updateProfile(data: {
  nickname?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar?: string;
}) {
  return apiClient.put<UserProfile>('/api/user/me', data);
}

/**
 * 关注用户
 */
export async function followUser(userId: string) {
  return apiClient.post<{ isFollowing: boolean }>(`/api/user/follows/${userId}`);
}

/**
 * 取消关注用户
 */
export async function unfollowUser(userId: string) {
  return apiClient.delete<{ isFollowing: boolean }>(`/api/user/follows/${userId}`);
}

/**
 * 获取关注列表
 */
export async function getFollowing(userId: string, page: number = 1, limit: number = 20) {
  return apiClient.get<FollowUser[]>(`/api/user/${userId}/following`, {
    params: { page, limit },
  });
}

/**
 * 获取粉丝列表
 */
export async function getFollowers(userId: string, page: number = 1, limit: number = 20) {
  return apiClient.get<FollowUser[]>(`/api/user/${userId}/followers`, {
    params: { page, limit },
  });
}

/**
 * 获取用户发布的帖子
 */
export async function getUserPosts(userId: string, page: number = 1, limit: number = 20) {
  return apiClient.get<any[]>(`/api/posts`, {
    params: { userId, page, limit },
  });
}
