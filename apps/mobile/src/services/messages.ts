/**
 * 消息相关 API 服务
 */

import { apiClient } from './api';

/**
 * 对话用户接口
 */
export interface ConversationUser {
  id: number;
  nickname: string;
  avatar?: string;
  isVerified?: boolean;
}

/**
 * 对话接口（支持私聊和群聊）
 */
export interface Conversation {
  id: string;
  type: 'private' | 'group';
  // 私聊
  otherUser?: ConversationUser;
  // 群聊
  name?: string;
  avatar?: string;
  memberCount?: number;
  myRole?: 'owner' | 'admin' | 'member';
  // 通用
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
    messageType?: string;
  };
  unreadCount: number;
  lastMessageAt: string;
}

/**
 * 群聊成员接口
 */
export interface GroupMember {
  id: number;
  nickname: string;
  avatar?: string;
  isVerified?: boolean;
  role: 'owner' | 'admin' | 'member';
  nickname_in_group?: string;
  isMuted?: boolean;
  joinedAt: string;
}

/**
 * 群聊详情接口
 */
export interface GroupDetail {
  id: string;
  type: 'group';
  name: string;
  avatar?: string;
  description?: string;
  creatorId: string;
  memberCount: number;
  maxMembers: number;
  myRole: 'owner' | 'admin' | 'member';
  participants: GroupMember[];
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

// ==================== 群聊相关 API ====================

/**
 * 创建群聊
 */
export async function createGroup(data: {
  name: string;
  memberIds: string[];
  avatar?: string;
  description?: string;
}) {
  return apiClient.post<{
    id: string;
    type: 'group';
    name: string;
    avatar?: string;
    memberCount: number;
    isNew: boolean;
  }>('/api/messages/groups', data);
}

/**
 * 获取群聊详情
 */
export async function getGroupDetail(groupId: string) {
  return apiClient.get<GroupDetail>(`/api/messages/groups/${groupId}`);
}

/**
 * 更新群聊信息
 */
export async function updateGroup(groupId: string, data: {
  name?: string;
  avatar?: string;
  description?: string;
}) {
  return apiClient.put<{
    id: string;
    name: string;
    avatar?: string;
    description?: string;
  }>(`/api/messages/groups/${groupId}`, data);
}

/**
 * 添加群成员
 */
export async function addGroupMembers(groupId: string, memberIds: string[]) {
  return apiClient.post<{
    success: boolean;
    addedCount: number;
  }>(`/api/messages/groups/${groupId}/members`, { memberIds });
}

/**
 * 移除群成员
 */
export async function removeGroupMember(groupId: string, memberId: string) {
  return apiClient.delete<{ success: boolean }>(
    `/api/messages/groups/${groupId}/members?memberId=${memberId}`
  );
}

/**
 * 退出群聊
 */
export async function leaveGroup(groupId: string) {
  return apiClient.post<{ success: boolean; message: string }>(
    `/api/messages/groups/${groupId}/leave`
  );
}

/**
 * 解散群聊
 */
export async function disbandGroup(groupId: string) {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/api/messages/groups/${groupId}`
  );
}
