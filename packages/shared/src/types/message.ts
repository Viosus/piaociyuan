// 聊天系统：Conversation / Message / Group 相关类型
// 对应 Prisma schema:485-549

export type ConversationType = 'private' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type ParticipantRole = 'owner' | 'admin' | 'member';

export interface Conversation {
  id: string;                  // UUID
  type: string;
  name: string | null;
  avatar: string | null;
  description: string | null;
  creatorId: string | null;
  maxMembers: number;
  memberCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;

  // 可能附带
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: string;
  nickname: string | null;
  isMuted: boolean;
  unreadCount: number;
  lastReadAt: string;
  joinedAt: string;
}

export interface Message {
  id: string;                  // UUID
  conversationId: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  messageType: string;
  isRead: boolean;
  readBy: string | null;       // JSON 数组字符串
  createdAt: string;

  // 可能附带
  sender?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
}
