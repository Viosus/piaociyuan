'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';

interface Event {
  id: number;
  name: string;
  cover: string;
  date: string;
  city: string;
  venue: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  event: Event | null;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

  // 加载通知列表
  const loadNotifications = async () => {
    setLoading(true);

    try {
      const result = await apiGet('/api/notifications');
      if (result.ok) {
        setNotifications(result.data);
        setStats(result.stats);
      } else {
        console.error('[LOAD_NOTIFICATIONS_ERROR]', result.message);
      }
    } catch (error) {
      console.error('[LOAD_NOTIFICATIONS_ERROR]', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      const result = await apiPatch(`/api/notifications/${notificationId}/read`);

      if (result.ok) {
        // 更新本地状态
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1,
        }));
      }
    } catch (error) {
      console.error('[MARK_READ_ERROR]', error);
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      const result = await apiPatch('/api/notifications/read-all');

      if (result.ok) {
        // 更新本地状态
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setStats((prev) => ({
          ...prev,
          unread: 0,
          read: prev.total,
        }));
        alert('✅ 已标记全部为已读');
      }
    } catch (error) {
      console.error('[MARK_ALL_READ_ERROR]', error);
      alert('❌ 操作失败，请稍后重试');
    }
  };

  // 当抽屉打开时加载通知
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // 获取通知类型图标和标签
  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case 'event_onsale':
        return { icon: '🎉', label: '活动开售', color: 'text-green-600' };
      case 'event_upcoming':
        return { icon: '⏰', label: '活动临近', color: 'text-blue-600' };
      case 'price_change':
        return { icon: '💰', label: '价格变动', color: 'text-yellow-600' };
      case 'low_stock':
        return { icon: '⚠️', label: '库存告急', color: 'text-red-600' };
      case 'message':
        return { icon: '✉️', label: '私信', color: 'text-purple-600' };
      default:
        return { icon: '📢', label: '系统通知', color: 'text-[#282828]' };
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 抽屉 */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#EAF353]">
          <div>
            <h2 className="text-xl font-bold text-white">通知中心</h2>
            <p className="text-sm text-white/80">
              {stats.unread > 0 ? `${stats.unread} 条未读` : '没有未读通知'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <span className="text-2xl text-white">×</span>
          </button>
        </div>

        {/* 操作按钮 */}
        {stats.unread > 0 && (
          <div className="p-4 border-b border-gray-200 bg-[#FFFAFD]">
            <button
              onClick={markAllAsRead}
              className="text-sm text-[#EAF353] hover:text-[#FFC9E0] font-medium"
            >
              ✓ 全部标记为已读
            </button>
          </div>
        )}

        {/* 通知列表 */}
        <div className="overflow-y-auto h-[calc(100%-8rem)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#EAF353]"></div>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-[#282828]">暂无通知</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div>
              {notifications.map((notification) => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    {/* 通知头部 */}
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{typeInfo.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <h3 className="font-semibold text-[#EAF353] mb-1 line-clamp-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[#282828] line-clamp-2 mb-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[#282828] opacity-60">
                          <span>{formatTime(notification.createdAt)}</span>
                          {notification.link && (
                            <span className="text-[#EAF353]">查看详情 →</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 关联的活动信息 */}
                    {notification.event && (
                      <div className="mt-3 ml-9 flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                        <img
                          src={notification.event.cover}
                          alt={notification.event.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#282828] line-clamp-1">
                            {notification.event.name}
                          </p>
                          <p className="text-xs text-[#282828] line-clamp-1">
                            {notification.event.city} · {notification.event.venue}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
