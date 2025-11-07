/**
 * 消息相关 API 服务
 */

import { apiClient } from './api';

/**
 * 对话接口
 */
export interface Conversation {
  id: string;
  participants: {
    id: number;
    nickname: string;
    avatar?: string;
    isVerified: boolean;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: number;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

/**
 * 消息接口
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
}

/**
 * 获取对话列表
 */
export async function getConversations(page: number = 1, limit: number = 20) {
  return apiClient.get<Conversation[]>('/api/messages/conversations', {
    params: { page, limit },
  });
}

/**
 * 获取对话详情
 */
export async function getConversation(conversationId: string) {
  return apiClient.get<Conversation>(`/api/messages/conversations/${conversationId}`);
}

/**
 * 创建对话
 */
export async function createConversation(participantId: number) {
  return apiClient.post<Conversation>('/api/messages/conversations', {
    participantId,
  });
}

/**
 * 获取对话消息列表
 */
export async function getMessages(conversationId: string, page: number = 1, limit: number = 50) {
  return apiClient.get<Message[]>(`/api/messages/conversations/${conversationId}/messages`, {
    params: { page, limit },
  });
}

/**
 * 发送消息
 */
export async function sendMessage(conversationId: string, content: string) {
  return apiClient.post<Message>(`/api/messages/conversations/${conversationId}/messages`, {
    content,
  });
}

/**
 * 标记消息为已读
 */
export async function markAsRead(conversationId: string, messageId: string) {
  return apiClient.put<{ success: boolean }>(
    `/api/messages/conversations/${conversationId}/messages/${messageId}/read`
  );
}

/**
 * 标记对话所有消息为已读
 */
export async function markConversationAsRead(conversationId: string) {
  return apiClient.put<{ success: boolean }>(
    `/api/messages/conversations/${conversationId}/read`
  );
}

/**
 * 删除对话
 */
export async function deleteConversation(conversationId: string) {
  return apiClient.delete<{ success: boolean }>(
    `/api/messages/conversations/${conversationId}`
  );
}

/**
 * 获取未读消息总数
 */
export async function getUnreadCount() {
  return apiClient.get<{ count: number }>('/api/messages/unread-count');
}
