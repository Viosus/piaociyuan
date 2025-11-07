/**
 * 收藏相关 API 服务
 */

import { apiClient } from './api';

/**
 * 获取用户收藏的帖子列表
 */
export async function getFavorites(page: number = 1, limit: number = 20) {
  return apiClient.get<any[]>('/api/user/favorites', {
    params: { page, limit },
  });
}

/**
 * 收藏帖子
 */
export async function favoritePost(postId: string) {
  return apiClient.post<{ isFavorited: boolean }>(`/api/posts/${postId}/favorite`);
}

/**
 * 取消收藏帖子
 */
export async function unfavoritePost(postId: string) {
  return apiClient.delete<{ isFavorited: boolean }>(`/api/posts/${postId}/favorite`);
}

/**
 * 检查帖子是否已收藏
 */
export async function checkFavoriteStatus(postId: string) {
  return apiClient.get<{ isFavorited: boolean }>(`/api/posts/${postId}/favorite`);
}
