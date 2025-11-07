/**
 * 在线状态管理 Hook
 */

import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { SocketEvent } from '../services/socket';

interface OnlineStatus {
  [userId: number]: boolean;
}

/**
 * 使用在线状态
 */
export const useOnlineStatus = (userIds: number[]) => {
  const { isConnected, on, off } = useSocket();
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});

  useEffect(() => {
    if (!isConnected || userIds.length === 0) return;

    // 监听用户上线
    const handleUserOnline = (data: { userId: number }) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({
          ...prev,
          [data.userId]: true,
        }));
      }
    };

    // 监听用户下线
    const handleUserOffline = (data: { userId: number }) => {
      if (userIds.includes(data.userId)) {
        setOnlineStatus((prev) => ({
          ...prev,
          [data.userId]: false,
        }));
      }
    };

    on(SocketEvent.UserOnline, handleUserOnline);
    on(SocketEvent.UserOffline, handleUserOffline);

    // 请求初始在线状态
    // 可以通过 Socket 或 API 获取
    // TODO: 实现获取初始在线状态的逻辑

    return () => {
      off(SocketEvent.UserOnline, handleUserOnline);
      off(SocketEvent.UserOffline, handleUserOffline);
    };
  }, [userIds, isConnected]);

  /**
   * 检查用户是否在线
   */
  const isUserOnline = (userId: number): boolean => {
    return onlineStatus[userId] || false;
  };

  return {
    onlineStatus,
    isUserOnline,
  };
};
