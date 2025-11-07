import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * 推送通知服务
 *
 * 使用 Expo Notifications 管理推送通知
 */

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 通知类型
 */
export type NotificationType =
  | 'event_reminder' // 活动提醒
  | 'order_status' // 订单状态
  | 'ticket_status' // 门票状态
  | 'post_like' // 帖子点赞
  | 'post_comment' // 帖子评论
  | 'new_follower' // 新粉丝
  | 'new_message' // 新消息
  | 'nft_minted' // NFT 铸造完成
  | 'system'; // 系统通知

/**
 * 通知数据结构
 */
export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

/**
 * 请求推送通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('推送通知仅在真实设备上可用');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('未获得推送通知权限');
    return false;
  }

  return true;
}

/**
 * 获取 Expo Push Token
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('推送 Token 仅在真实设备上可用');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // 替换为实际的 Expo Project ID
    });

    console.log('Expo Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('获取 Push Token 失败:', error);
    return null;
  }
}

/**
 * 上传 Push Token 到服务器
 */
export async function uploadPushToken(token: string): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/api/notifications/token', {
    token,
    platform: Platform.OS,
    deviceId: Device.modelName,
  });
}

/**
 * 配置 Android 通知渠道
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '默认通知',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });

    await Notifications.setNotificationChannelAsync('events', {
      name: '活动提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: '消息通知',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: '社交互动',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#6366F1',
    });
  }
}

/**
 * 发送本地通知（测试用）
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // 立即触发
  });
}

/**
 * 取消所有通知
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 设置角标数量
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * 获取角标数量
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * 清除角标
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * 获取通知列表
 */
export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}): Promise<ApiResponse<{ data: AppNotification[]; total: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.type) queryParams.append('type', params.type);
  if (params?.isRead !== undefined) queryParams.append('isRead', String(params.isRead));

  const query = queryParams.toString();
  return apiClient.get<{ data: AppNotification[]; total: number }>(
    `/api/notifications${query ? `?${query}` : ''}`
  );
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(id: number): Promise<ApiResponse<void>> {
  return apiClient.put<void>(`/api/notifications/${id}/read`, {});
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
  return apiClient.put<void>('/api/notifications/read-all', {});
}

/**
 * 删除通知
 */
export async function deleteNotification(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/api/notifications/${id}`);
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get<{ count: number }>('/api/notifications/unread-count');
}

/**
 * 通知点击处理器类型
 */
export type NotificationClickHandler = (notification: AppNotification) => void;

/**
 * 监听通知点击事件
 */
export function addNotificationClickListener(
  handler: NotificationClickHandler
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data) {
      handler(data as AppNotification);
    }
  });
}

/**
 * 监听接收到通知事件
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * 初始化通知服务
 */
export async function initializeNotifications(): Promise<string | null> {
  try {
    // 1. 配置 Android 通知渠道
    await setupNotificationChannels();

    // 2. 请求权限
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('未获得通知权限');
      return null;
    }

    // 3. 获取 Push Token
    const token = await getExpoPushToken();
    if (!token) {
      console.warn('未能获取 Push Token');
      return null;
    }

    // 4. 上传 Token 到服务器
    const uploadResult = await uploadPushToken(token);
    if (!uploadResult.success) {
      console.error('上传 Token 失败:', uploadResult.error);
    }

    return token;
  } catch (error) {
    console.error('初始化通知服务失败:', error);
    return null;
  }
}
