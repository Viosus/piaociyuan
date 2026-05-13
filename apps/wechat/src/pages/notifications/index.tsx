import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import Card from '../../components/Card';
import Empty from '../../components/Empty';
import './index.scss';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    load();
  });

  const load = async () => {
    setLoading(true);
    const res = await apiClient.get<Notification[]>('/api/notifications', { params: { limit: 30 } });
    if (res.ok && Array.isArray(res.data)) {
      setList(res.data);
    }
    setLoading(false);
  };

  return (
    <View className="notif-page">
      <ScrollView scrollY className="notif-list" enableBackToTop>
        {loading ? (
          <View className="loading">加载中...</View>
        ) : list.length === 0 ? (
          <Empty icon="🔔" title="还没有通知" />
        ) : (
          list.map((n) => (
            <Card key={n.id} className={n.isRead ? 'notif-read' : 'notif-unread'}>
              <View className="notif-row">
                <Text className="notif-icon">{iconFor(n.type)}</Text>
                <View className="notif-body">
                  <Text className={`notif-title ${n.isRead ? '' : 'unread'}`}>{n.title}</Text>
                  <Text className="notif-content">{n.content}</Text>
                  <Text className="notif-time">{formatTime(n.createdAt)}</Text>
                </View>
                {!n.isRead && <View className="notif-dot" />}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function iconFor(type: string): string {
  switch (type) {
    case 'like': return '❤️';
    case 'comment': return '💬';
    case 'follow': return '👥';
    case 'system': return '📢';
    case 'order': return '🎫';
    case 'message': return '✉️';
    default: return '🔔';
  }
}

function formatTime(s: string): string {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const day = Math.floor(diff / 86400000);
  if (day === 0) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (day === 1) return '昨天';
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
