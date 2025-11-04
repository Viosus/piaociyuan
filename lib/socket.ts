// lib/socket.ts - Socket.io 工具函数
import { Server as SocketIOServer } from 'socket.io';

/**
 * 获取全局 Socket.io 实例
 * 注意：只能在服务器端使用
 */
export function getIO(): SocketIOServer | null {
  if (typeof window !== 'undefined') {
    console.error('getIO() 只能在服务器端使用');
    return null;
  }

  if (!global.io) {
    console.warn('Socket.io 服务器未初始化');
    return null;
  }

  return global.io as SocketIOServer;
}

/**
 * 向指定用户推送消息
 */
export function emitToUser(userId: string, event: string, data: any) {
  const io = getIO();
  if (!io) return;

  io.to(`user:${userId}`).emit(event, data);
  console.log(`[Socket] 推送给用户 ${userId}: ${event}`, data);
}

/**
 * 向多个用户推送消息
 */
export function emitToUsers(userIds: string[], event: string, data: any) {
  const io = getIO();
  if (!io) return;

  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit(event, data);
  });
  console.log(`[Socket] 推送给 ${userIds.length} 个用户: ${event}`);
}

/**
 * 广播消息给所有在线用户
 */
export function broadcast(event: string, data: any) {
  const io = getIO();
  if (!io) return;

  io.emit(event, data);
  console.log(`[Socket] 广播: ${event}`, data);
}

// TypeScript 全局声明
declare global {
  var io: SocketIOServer | undefined;
}
