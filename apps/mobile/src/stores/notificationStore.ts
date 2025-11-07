import { create } from 'zustand';

export interface Notification {
  id: number;
  type: 'event' | 'follow' | 'comment' | 'like' | 'system' | 'order' | 'ticket';
  title: string;
  content: string;
  isRead: boolean;
  link?: string; // 跳转链接
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter((n) => !n.isRead).length;
      return { notifications: newNotifications, unreadCount };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = newNotifications.filter((n) => !n.isRead).length;
      return { notifications: newNotifications, unreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const newNotifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = newNotifications.filter((n) => !n.isRead).length;
      return { notifications: newNotifications, unreadCount };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },
}));
