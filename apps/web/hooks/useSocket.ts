// hooks/useSocket.ts - Socket.io 客户端 Hook
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Socket.io 客户端 Hook
 * 自动处理连接、认证、重连等
 */
export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // 连接 Socket.io
  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // 没有 token 时静默返回
      return;
    }

    setIsConnecting(true);

    socketRef.current = io({
      path: '/socket.io/',
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // 连接成功
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      onConnect?.();
    });

    // 连接断开
    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      setIsConnecting(false);
      onDisconnect?.();

      // 如果是服务器主动断开，尝试重连
      if (reason === 'io server disconnect') {
        socketRef.current?.connect();
      }
    });

    // 连接错误
    socketRef.current.on('connect_error', (error) => {
      // 如果是认证错误，静默处理（用户可能未登录或 token 过期）
      if (error.message.includes('Authentication') || error.message.includes('Invalid token')) {
        setIsConnecting(false);
        // 断开连接，停止重试
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        return;
      }

      setIsConnecting(false);
      onError?.(error);
    });

    // 重连尝试
    socketRef.current.on('reconnect_attempt', () => {
      setIsConnecting(true);
    });

    // 重连失败
    socketRef.current.on('reconnect_failed', () => {
      setIsConnecting(false);
    });
  };

  // 断开连接
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  };

  // 发送事件
  const emit = useCallback((event: string, data?: unknown) => {
    if (!socketRef.current?.connected) {
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []);

  // 监听事件 - 使用 useCallback 确保稳定引用
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // 移除监听 - 使用 useCallback 确保稳定引用
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // 获取当前 socket 实例（用于直接操作）
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    socket: socketRef.current,
    getSocket,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
