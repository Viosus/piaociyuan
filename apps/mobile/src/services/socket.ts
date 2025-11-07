/**
 * Socket.io 客户端服务
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

/**
 * Socket 事件类型
 */
export enum SocketEvent {
  // 连接事件
  Connect = 'connect',
  Disconnect = 'disconnect',
  Error = 'error',
  Reconnect = 'reconnect',

  // 消息事件
  NewMessage = 'message:new',
  MessageSent = 'message:sent',
  MessageRead = 'message:read',
  Typing = 'typing',
  StopTyping = 'typing:stop',

  // 在线状态事件
  UserOnline = 'user:online',
  UserOffline = 'user:offline',

  // 对话事件
  ConversationUpdated = 'conversation:updated',
}

/**
 * Socket 服务类
 */
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * 初始化 Socket 连接
   */
  async connect(): Promise<void> {
    try {
      // 获取 Token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('Socket: No token found, skipping connection');
        return;
      }

      // 如果已经连接，先断开
      if (this.socket?.connected) {
        console.log('Socket: Already connected');
        return;
      }

      // 获取 Socket URL（从 API_URL 转换）
      const socketUrl = API_URL.replace('/api', '').replace('http', 'ws');

      console.log('Socket: Connecting to', socketUrl);

      // 创建 Socket 连接
      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      // 设置事件监听器
      this.setupEventListeners();
    } catch (error) {
      console.error('Socket: Connect error:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Socket: Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 发送事件
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket: Not connected, cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * 监听事件
   */
  on(event: string, callback: Function): void {
    // 保存到本地监听器列表
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // 如果 socket 已连接，立即添加监听器
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      // 移除特定回调
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
      this.socket?.off(event, callback as any);
    } else {
      // 移除所有回调
      this.eventListeners.delete(event);
      this.socket?.off(event);
    }
  }

  /**
   * 设置内部事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 连接成功
    this.socket.on(SocketEvent.Connect, () => {
      console.log('Socket: Connected');
      this.reconnectAttempts = 0;
      this.triggerCallbacks(SocketEvent.Connect);
    });

    // 断开连接
    this.socket.on(SocketEvent.Disconnect, (reason: string) => {
      console.log('Socket: Disconnected:', reason);
      this.triggerCallbacks(SocketEvent.Disconnect, reason);
    });

    // 连接错误
    this.socket.on(SocketEvent.Error, (error: any) => {
      console.error('Socket: Error:', error);
      this.triggerCallbacks(SocketEvent.Error, error);
    });

    // 重连
    this.socket.on(SocketEvent.Reconnect, (attemptNumber: number) => {
      console.log('Socket: Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.triggerCallbacks(SocketEvent.Reconnect, attemptNumber);
    });

    // 重新添加所有已注册的监听器
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback as any);
      });
    });
  }

  /**
   * 触发回调函数
   */
  private triggerCallbacks(event: string, ...args: any[]): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  /**
   * 发送消息
   */
  sendMessage(conversationId: string, content: string): void {
    this.emit('message:send', {
      conversationId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 标记消息为已读
   */
  markMessageAsRead(messageId: string): void {
    this.emit('message:read', { messageId });
  }

  /**
   * 发送正在输入状态
   */
  sendTyping(conversationId: string): void {
    this.emit(SocketEvent.Typing, { conversationId });
  }

  /**
   * 发送停止输入状态
   */
  sendStopTyping(conversationId: string): void {
    this.emit(SocketEvent.StopTyping, { conversationId });
  }

  /**
   * 加入对话房间
   */
  joinConversation(conversationId: string): void {
    this.emit('conversation:join', { conversationId });
  }

  /**
   * 离开对话房间
   */
  leaveConversation(conversationId: string): void {
    this.emit('conversation:leave', { conversationId });
  }
}

// 导出单例
export const socketService = new SocketService();
export default socketService;
