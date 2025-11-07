/**
 * Socket Context - 全局管理 Socket 连接
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService, SocketEvent } from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextValue {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (conversationId: string, content: string) => void;
  markMessageAsRead: (messageId: string) => void;
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
    // 当用户登录时自动连接
    if (isAuthenticated) {
      handleConnect();
    } else {
      handleDisconnect();
    }

    return () => {
      // 组件卸载时断开连接
      handleDisconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // 监听连接状态变化
    const handleConnectEvent = () => {
      setIsConnected(true);
      console.log('Socket Context: Connected');
    };

    const handleDisconnectEvent = () => {
      setIsConnected(false);
      console.log('Socket Context: Disconnected');
    };

    socketService.on(SocketEvent.Connect, handleConnectEvent);
    socketService.on(SocketEvent.Disconnect, handleDisconnectEvent);

    return () => {
      socketService.off(SocketEvent.Connect, handleConnectEvent);
      socketService.off(SocketEvent.Disconnect, handleDisconnectEvent);
    };
  }, []);

  const handleConnect = async () => {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Socket Context: Connect error:', error);
    }
  };

  const handleDisconnect = () => {
    socketService.disconnect();
  };

  const value: SocketContextValue = {
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendMessage: socketService.sendMessage.bind(socketService),
    markMessageAsRead: socketService.markMessageAsRead.bind(socketService),
    sendTyping: socketService.sendTyping.bind(socketService),
    sendStopTyping: socketService.sendStopTyping.bind(socketService),
    joinConversation: socketService.joinConversation.bind(socketService),
    leaveConversation: socketService.leaveConversation.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

/**
 * 使用 Socket Context
 */
export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
