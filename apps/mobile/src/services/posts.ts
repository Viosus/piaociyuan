/**
 * 帖子相关 API 服务
 */

import { apiClient } from './api';

// 帖子类型定义
export interface Post {
  id: number;
  content: string;
  images: string[];
  userId: number;
  eventId?: number;
  location?: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
    isVerified?: boolean;
  };
  event?: {
    id: number;
    name: string;
    coverImage?: string;
  };
}

// 评论类型
export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentId?: number;
  likeCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
    isVerified?: boolean;
  };
  replies?: Comment[];
}

// 获取帖子列表参数
export interface GetPostsParams {
  page?: number;
  limit?: number;
  userId?: number;
  eventId?: number;
  sort?: 'latest' | 'hot' | 'following';
}

// 创建帖子参数
export interface CreatePostParams {
  content: string;
  images?: string[];
  eventId?: number;
  location?: string;
}

// 更新帖子参数
export interface UpdatePostParams {
  content?: string;
  images?: string[];
}

/**
 * 获取帖子列表
 */
export async function getPosts(params: GetPostsParams = {}) {
  return apiClient.get<Post[]>('/api/posts', {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      userId: params.userId,
      eventId: params.eventId,
      sort: params.sort || 'latest',
    },
    cache: false,
  });
}

/**
 * 获取帖子详情
 */
export async function getPostDetail(postId: string | number) {
  return apiClient.get<Post>(`/api/posts/${postId}`, {
    cache: false,
  });
}

/**
 * 创建帖子
 */
export async function createPost(data: CreatePostParams) {
  return apiClient.post<Post>('/api/posts', data);
}

/**
 * 更新帖子
 */
export async function updatePost(postId: string | number, data: UpdatePostParams) {
  return apiClient.put<Post>(`/api/posts/${postId}`, data);
}

/**
 * 删除帖子
 */
export async function deletePost(postId: string | number) {
  return apiClient.delete(`/api/posts/${postId}`);
}

/**
 * 点赞帖子
 */
export async function likePost(postId: string | number) {
  return apiClient.post(`/api/posts/${postId}/like`);
}

/**
 * 取消点赞帖子
 */
export async function unlikePost(postId: string | number) {
  return apiClient.delete(`/api/posts/${postId}/like`);
}

/**
 * 收藏帖子
 */
export async function favoritePost(postId: string | number) {
  return apiClient.post(`/api/posts/${postId}/favorite`);
}

/**
 * 取消收藏帖子
 */
export async function unfavoritePost(postId: string | number) {
  return apiClient.delete(`/api/posts/${postId}/favorite`);
}

/**
 * 获取帖子评论
 */
export async function getPostComments(postId: string | number, page: number = 1, limit: number = 20) {
  return apiClient.get<Comment[]>(`/api/posts/${postId}/comments`, {
    params: { page, limit },
    cache: false,
  });
}

/**
 * 创建评论
 */
export async function createComment(postId: string | number, content: string, parentId?: number) {
  return apiClient.post<Comment>(`/api/posts/${postId}/comments`, {
    content,
    parentId,
  });
}

/**
 * 删除评论
 */
export async function deleteComment(postId: string | number, commentId: string | number) {
  return apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
}

/**
 * 点赞评论
 */
export async function likeComment(postId: string | number, commentId: string | number) {
  return apiClient.post(`/api/posts/${postId}/comments/${commentId}/like`);
}

/**
 * 取消点赞评论
 */
export async function unlikeComment(postId: string | number, commentId: string | number) {
  return apiClient.delete(`/api/posts/${postId}/comments/${commentId}/like`);
}

/**
 * 上传帖子图片
 */
export async function uploadPostImage(uri: string) {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);

  return apiClient.post<{ url: string }>('/api/upload/post-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
