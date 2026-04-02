/**
 * 消息状态集中管理 Store
 * 统一管理 conversations、messages、unreadCount、typing 状态
 * 解决 ConversationsScreen / EncoreScreen / ChatScreen 状态不同步问题
 */

import { create } from 'zustand';
import type { Conversation, Message } from '../services/messages';
import {
  getConversations,
  getMessages,
  getUnreadCount,
  markConversationAsRead as apiMarkConversationAsRead,
  sendMessage as apiSendMessage,
} from '../services/messages';

interface TypingInfo {
  userId: number;
  timeout: ReturnType<typeof setTimeout>;
}

interface MessagingState {
  // 会话列表（唯一数据源）
  conversations: Conversation[];
  conversationsLoaded: boolean;

  // 消息按 conversationId 分组
  messagesByConversation: Record<string, Message[]>;

  // 消息分页状态
  messagePagination: Record<string, { page: number; hasMore: boolean; loading: boolean }>;

  // 打字指示器
  typingUsers: Record<string, TypingInfo>;

  // 当前活跃的聊天 ID（用于判断是否需要标记已读）
  activeConversationId: string | null;

  // 加载状态
  conversationsLoading: boolean;

  // 计算属性：总未读数（从 conversations 计算，不独立跟踪）
  getTotalUnreadCount: () => number;

  // Actions
  loadConversations: (silent?: boolean) => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;

  addMessage: (conversationId: string, message: Message) => void;
  addOptimisticMessage: (conversationId: string, content: string, senderId: number, senderName: string) => string;
  replaceOptimisticMessage: (conversationId: string, tempId: string, realMessage: Message) => void;

  updateConversationWithMessage: (message: Message) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;

  setActiveConversation: (conversationId: string | null) => void;

  setTyping: (conversationId: string, userId: number) => void;
  clearTyping: (conversationId: string, userId: number) => void;
  clearAllTyping: () => void;

  updateConversation: (conversation: Conversation) => void;
  syncAfterReconnect: () => Promise<void>;

  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
}

let tempIdCounter = 0;

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  conversationsLoaded: false,
  messagesByConversation: {},
  messagePagination: {},
  typingUsers: {},
  activeConversationId: null,
  conversationsLoading: false,

  getTotalUnreadCount: () => {
    return get().conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  },

  loadConversations: async (silent = false) => {
    if (!silent) {
      set({ conversationsLoading: true });
    }
    try {
      const response = await getConversations(1, 50);
      if (response.ok && response.data) {
        set({ conversations: response.data, conversationsLoaded: true });
      }
    } catch {
      // 静默处理
    } finally {
      if (!silent) {
        set({ conversationsLoading: false });
      }
    }
  },

  loadMessages: async (conversationId: string, page = 1) => {
    set((state) => ({
      messagePagination: {
        ...state.messagePagination,
        [conversationId]: {
          page,
          hasMore: state.messagePagination[conversationId]?.hasMore ?? true,
          loading: true,
        },
      },
    }));

    try {
      const response = await getMessages(conversationId, page, 50);
      if (response.ok && response.data) {
        const newMessages = response.data;
        set((state) => {
          const existing = page === 1 ? [] : (state.messagesByConversation[conversationId] || []);
          // 去重合并
          const existingIds = new Set(existing.map((m) => m.id));
          const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
          // 第一页：倒序（最新在前）；加载更多：追加到末尾
          const merged = page === 1
            ? [...newMessages].reverse()
            : [...existing, ...uniqueNew.reverse()];

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: merged,
            },
            messagePagination: {
              ...state.messagePagination,
              [conversationId]: {
                page,
                hasMore: newMessages.length >= 50,
                loading: false,
              },
            },
          };
        });
      }
    } catch {
      set((state) => ({
        messagePagination: {
          ...state.messagePagination,
          [conversationId]: {
            ...state.messagePagination[conversationId],
            loading: false,
          },
        },
      }));
    }
  },

  loadOlderMessages: async (conversationId: string) => {
    const pagination = get().messagePagination[conversationId];
    if (!pagination || pagination.loading || !pagination.hasMore) return;
    await get().loadMessages(conversationId, pagination.page + 1);
  },

  addMessage: (conversationId: string, message: Message) => {
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      // 去重：如果消息 ID 已存在则跳过
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [message, ...existing],
        },
      };
    });
  },

  addOptimisticMessage: (conversationId: string, content: string, senderId: number, senderName: string) => {
    const tempId = `temp_${Date.now()}_${++tempIdCounter}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: senderId, nickname: senderName },
    };

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [optimisticMessage, ...(state.messagesByConversation[conversationId] || [])],
      },
    }));

    return tempId;
  },

  replaceOptimisticMessage: (conversationId: string, tempId: string, realMessage: Message) => {
    set((state) => {
      const messages = state.messagesByConversation[conversationId] || [];
      // 如果真实消息已存在（Socket 广播已到达），只需移除临时消息
      const realExists = messages.some((m) => m.id === realMessage.id);
      const updated = messages
        .filter((m) => m.id !== tempId)
        .concat(realExists ? [] : []);

      if (!realExists) {
        // 替换临时消息为真实消息
        const withoutTemp = messages.filter((m) => m.id !== tempId);
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [realMessage, ...withoutTemp.filter((m) => m.id !== realMessage.id)],
          },
        };
      }

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: updated,
        },
      };
    });
  },

  updateConversationWithMessage: (message: Message) => {
    set((state) => {
      const conversations = [...state.conversations];
      const index = conversations.findIndex((c) => c.id === message.conversationId);

      if (index >= 0) {
        const conv = { ...conversations[index] };
        conv.lastMessage = {
          id: message.id,
          content: message.content,
          senderId: String(message.senderId),
          createdAt: message.createdAt,
          isRead: false,
        };
        conv.lastMessageAt = message.createdAt;

        // 如果当前不在这个会话中，增加未读数
        if (state.activeConversationId !== message.conversationId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        // 移到顶部
        conversations.splice(index, 1);
        conversations.unshift(conv);
      }

      return { conversations };
    });
  },

  markConversationAsRead: async (conversationId: string) => {
    // 立即更新本地状态
    set((state) => {
      const conversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      return { conversations };
    });

    // 异步同步到服务器
    try {
      await apiMarkConversationAsRead(conversationId);
    } catch {
      // 静默处理，本地状态已更新
    }
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  setTyping: (conversationId: string, userId: number) => {
    const state = get();
    const key = `${conversationId}_${userId}`;
    const existing = state.typingUsers[key];

    // 清除旧的 timeout
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // 3 秒后自动清除
    const timeout = setTimeout(() => {
      get().clearTyping(conversationId, userId);
    }, 3000);

    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [key]: { userId, timeout },
      },
    }));
  },

  clearTyping: (conversationId: string, userId: number) => {
    const key = `${conversationId}_${userId}`;
    set((state) => {
      const existing = state.typingUsers[key];
      if (existing) {
        clearTimeout(existing.timeout);
      }
      const { [key]: _, ...rest } = state.typingUsers;
      return { typingUsers: rest };
    });
  },

  clearAllTyping: () => {
    const state = get();
    Object.values(state.typingUsers).forEach((info) => clearTimeout(info.timeout));
    set({ typingUsers: {} });
  },

  updateConversation: (conversation: Conversation) => {
    set((state) => {
      const conversations = [...state.conversations];
      const index = conversations.findIndex((c) => c.id === conversation.id);
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.unshift(conversation);
      }
      return { conversations };
    });
  },

  syncAfterReconnect: async () => {
    // 重连后同步最新状态
    await get().loadConversations(true);

    // 如果当前有打开的聊天，重新加载消息
    const activeId = get().activeConversationId;
    if (activeId) {
      await get().loadMessages(activeId, 1);
      await get().markConversationAsRead(activeId);
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      // 仅通过 API 发送（不通过 Socket 直发，避免重复）
      const response = await apiSendMessage(conversationId, content);
      if (response.ok && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  },
}));
