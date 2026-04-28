/**
 * Socket Context - 全局管理 Socket 连接
 * Socket 事件统一在此处监听，写入 Zustand messagingStore
 * 页面只从 store 读取数据，不直接监听 Socket 事件
 */

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService, SocketEvent } from '../services/socket';
import { useAuth } from './AuthContext';
import { useMessagingStore } from '../stores/messagingStore';
import type { Message, Conversation } from '../services/messages';

interface SocketContextValue {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTyping: (conversationId: string) => void;
  sendStopTyping: (conversationId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      handleConnect();
    } else {
      handleDisconnect();
    }

    return () => {
      handleDisconnect();
    };
  }, [isAuthenticated]);

  // 连接状态监听
  useEffect(() => {
    const handleConnectEvent = () => {
      setIsConnected(true);
    };

    const handleDisconnectEvent = () => {
      setIsConnected(false);
      // 断连时清除所有打字指示器
      useMessagingStore.getState().clearAllTyping();
    };

    socketService.on(SocketEvent.Connect, handleConnectEvent);
    socketService.on(SocketEvent.Disconnect, handleDisconnectEvent);

    return () => {
      socketService.off(SocketEvent.Connect, handleConnectEvent);
      socketService.off(SocketEvent.Disconnect, handleDisconnectEvent);
    };
  }, []);

  // 集中监听所有消息相关 Socket 事件，写入 Zustand store
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      const store = useMessagingStore.getState();
      // 添加消息（store 内部会去重）
      store.addMessage(message.conversationId, message);
      // 更新会话列表
      store.updateConversationWithMessage(message);
      // 如果当前正在查看这个会话，自动标记已读
      if (store.activeConversationId === message.conversationId) {
        store.markConversationAsRead(message.conversationId);
      }
    };

    // 注意：服务端 server.js 当前没有 emit conversation:updated 事件，
    // 这一段保留是为了将来服务端支持时直接生效；目前不会触发。
    const handleConversationUpdated = (conversation: Conversation) => {
      useMessagingStore.getState().updateConversation(conversation);
    };

    const handleTyping = (data: { conversationId: string; userId: number }) => {
      useMessagingStore.getState().setTyping(data.conversationId, data.userId);
    };

    const handleStopTyping = (data: { conversationId: string; userId: number }) => {
      useMessagingStore.getState().clearTyping(data.conversationId, data.userId);
    };

    const handleReconnect = () => {
      // 重连后同步最新状态
      useMessagingStore.getState().syncAfterReconnect();
    };

    socketService.on(SocketEvent.NewMessage, handleNewMessage);
    socketService.on('conversation:updated', handleConversationUpdated);
    socketService.on(SocketEvent.Typing, handleTyping);
    socketService.on(SocketEvent.StopTyping, handleStopTyping);
    socketService.on(SocketEvent.Reconnect, handleReconnect);

    return () => {
      socketService.off(SocketEvent.NewMessage, handleNewMessage);
      socketService.off('conversation:updated', handleConversationUpdated);
      socketService.off(SocketEvent.Typing, handleTyping);
      socketService.off(SocketEvent.StopTyping, handleStopTyping);
      socketService.off(SocketEvent.Reconnect, handleReconnect);
    };
  }, []);

  // 登录后自动加载会话列表
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      const store = useMessagingStore.getState();
      if (!store.conversationsLoaded) {
        store.loadConversations();
      }
    }
  }, [isAuthenticated, isConnected]);

  // App 切回前台时主动重连 + 同步消息（修复"切回前台需要刷新"的问题）
  useEffect(() => {
    if (!isAuthenticated) return;

    const appStateRef = { current: AppState.currentState as AppStateStatus };
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      // 从后台/不活跃 -> 活跃：重连 socket + 同步最新消息
      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        socketService.connect().catch(() => {
          // 静默处理，下面的 syncAfterReconnect 仍会拉取最新数据兜底
        });
        useMessagingStore.getState().syncAfterReconnect();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Polling fallback：Socket 长时间断连时降级为 HTTP 轮询，避免漏消息
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      disconnectStartRef.current = null;
      return;
    }

    if (isConnected) {
      // 已连上 -> 取消 polling
      disconnectStartRef.current = null;
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    // 未连上 -> 30s 后启动 polling
    if (disconnectStartRef.current === null) {
      disconnectStartRef.current = Date.now();
    }

    const startupDelay = setTimeout(() => {
      if (pollingTimerRef.current) return;
      pollingTimerRef.current = setInterval(() => {
        const store = useMessagingStore.getState();
        store.loadConversations(true);
        const activeId = store.activeConversationId;
        if (activeId) {
          store.loadMessages(activeId, 1);
        }
      }, 15000);
    }, 30000);

    return () => {
      clearTimeout(startupDelay);
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isAuthenticated, isConnected]);

  const handleConnect = async () => {
    try {
      await socketService.connect();
    } catch {
      // 连接失败静默处理，会自动重试
    }
  };

  const handleDisconnect = () => {
    socketService.disconnect();
  };

  const value: SocketContextValue = {
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendTyping: socketService.sendTyping.bind(socketService),
    sendStopTyping: socketService.sendStopTyping.bind(socketService),
    joinConversation: socketService.joinConversation.bind(socketService),
    leaveConversation: socketService.leaveConversation.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
