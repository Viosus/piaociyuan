// components/RightSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export default function RightSidebar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔥 使用 WebSocket 实时通信
  const { isConnected, on, off } = useSocket({
    autoConnect: true,
  });

  // 更新CSS变量以控制页面布局
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--right-sidebar-width',
      isExpanded ? '320px' : '64px'
    );
  }, [isExpanded]);

  // 加载通知
  const loadNotifications = async () => {
    try {
      const result = await apiGet('/api/notifications?limit=10');
      if (result.ok) {
        setNotifications(result.data);
        setUnreadNotifications(result.stats.unread);
      }
    } catch {
      // 静默处理加载通知失败
    }
  };

  // 加载对话列表
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.slice(0, 10)); // 只显示最近10个
        const unread = data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
        setUnreadMessages(unread);
      }
    } catch {
      // 静默处理加载对话失败
    }
  };

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      return !!token;
    };

    // 初始检查
    const loggedIn = checkLoginStatus();

    if (!loggedIn) {
      // 未登录时清空数据
      setNotifications([]);
      setConversations([]);
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }

    // 加载数据
    loadNotifications();
    loadConversations();
  }, []);

  // 🔥 监听实时消息和通知
  useEffect(() => {
    if (!isConnected || !isLoggedIn) return;

    // 监听新消息
    const handleNewMessage = () => {
      // 重新加载对话列表
      loadConversations();

      // 增加未读消息数
      setUnreadMessages(prev => prev + 1);
    };

    // 监听新通知
    const handleNewNotification = (notification: Notification) => {
      // 添加到通知列表
      setNotifications(prev => [notification, ...prev].slice(0, 10));

      // 增加未读通知数
      setUnreadNotifications(prev => prev + 1);
    };

    // 监听消息已读
    const handleMessageRead = () => {
      loadConversations();
    };

    on('message:new', handleNewMessage);
    on('notification:new', handleNewNotification);
    on('message:read', handleMessageRead);

    return () => {
      off('message:new', handleNewMessage);
      off('notification:new', handleNewNotification);
      off('message:read', handleMessageRead);
    };
  }, [isConnected, isLoggedIn, on, off]);

  // 当展开时加载数据
  useEffect(() => {
    if (isExpanded) {
      setLoading(true);
      if (activeTab === 'notifications') {
        loadNotifications().finally(() => setLoading(false));
      } else {
        loadConversations().finally(() => setLoading(false));
      }
    }
  }, [isExpanded, activeTab]);

  // 标记通知为已读
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiPatch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch {
      // 静默处理标记已读失败
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 获取通知类型图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_onsale': return '🎉';
      case 'event_upcoming': return '⏰';
      case 'price_change': return '💰';
      case 'low_stock': return '⚠️';
      case 'message': return '✉️';
      default: return '📢';
    }
  };

  const totalUnread = unreadNotifications + unreadMessages;

  // 未登录时不显示侧边栏
  if (!isLoggedIn) {
    return null;
  }

  return (
    <aside
      className={`fixed right-0 top-0 h-screen bg-[#46467A] border-l border-[#46467A]/30 flex flex-col z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-80' : 'w-16'
      }`}
    >
      {/* 顶部：展开/收起按钮 */}
      <div className="h-20 border-b border-white/20 flex items-center justify-center px-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          title={isExpanded ? '收起' : '展开'}
        >
          {/* 箭头图标 */}
          <svg
            className={`w-6 h-6 text-white transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {!isExpanded && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Tab切换 + 新建按钮 - 仅展开时显示 */}
      {isExpanded && (
        <>
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'text-white bg-white/10 border-b-2 border-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🔔 通知</span>
                {unreadNotifications > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'messages'
                  ? 'text-white bg-white/10 border-b-2 border-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>💬 私信</span>
                {unreadMessages > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* 新建私信按钮 - 仅在私信tab显示 */}
          {activeTab === 'messages' && (
            <div className="p-3 border-b border-white/20">
              <button
                onClick={() => router.push('/messages/new')}
                className="w-full py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建私信
              </button>
            </div>
          )}
        </>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {!isExpanded ? (
          // 收起状态：显示图标
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={() => {
                setIsExpanded(true);
                setActiveTab('notifications');
              }}
              className="relative w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <span className="text-2xl">🔔</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => {
                setIsExpanded(true);
                setActiveTab('messages');
              }}
              className="relative w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <span className="text-2xl">💬</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        ) : (
          // 展开状态：显示列表
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : activeTab === 'notifications' ? (
              // 通知列表
              notifications.length === 0 ? (
                <div className="text-center py-12 text-white/60 text-sm">
                  暂无通知
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.isRead) markNotificationAsRead(notification.id);
                        if (notification.link) router.push(notification.link);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        notification.isRead
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-white/15 hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white text-sm font-medium line-clamp-1">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-white/60 text-xs line-clamp-2 mb-1">
                            {notification.content}
                          </p>
                          <p className="text-white/40 text-xs">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // 私信列表
              conversations.length === 0 ? (
                <div className="text-center py-12 text-white/60 text-sm">
                  暂无对话
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/messages/${conv.id}`)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        conv.unreadCount > 0
                          ? 'bg-white/15 hover:bg-white/20'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {conv.otherUser.avatar ? (
                          <img
                            src={conv.otherUser.avatar}
                            alt={conv.otherUser.nickname}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {conv.otherUser.nickname[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-white text-sm font-medium truncate">
                              {conv.otherUser.nickname}
                            </h4>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-xs truncate">
                            {conv.lastMessage?.content || '开始对话...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* 底部：查看全部按钮 - 仅展开时显示 */}
      {isExpanded && (
        <div className="p-3 border-t border-white/20">
          <button
            onClick={() => router.push(activeTab === 'notifications' ? '/notifications' : '/messages')}
            className="w-full py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          >
            查看全部
          </button>
        </div>
      )}
    </aside>
  );
}
