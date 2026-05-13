import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn, logout } from '../../services/auth';
import { setUser, StoredUser } from '../../services/storage';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import { toast } from '../../components/Toast';
import './index.scss';

interface UserMe {
  id: string;
  phone?: string | null;
  email?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  bio?: string | null;
  isVerified?: boolean;
}

export default function MePage() {
  const [user, setUserState] = useState<UserMe | null>(null);
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
    const res = await apiClient.get<UserMe>('/api/user/me');
    if (res.ok && res.data) {
      setUserState(res.data);
      // 顺便更新本地缓存
      setUser(res.data as StoredUser);
    }
    setLoading(false);
  };

  const onLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => {
        if (r.confirm) {
          logout();
          toast.info('已退出登录');
        }
      },
    });
  };

  return (
    <View className="me-page">
      {loading ? (
        <View className="loading">加载中...</View>
      ) : !user ? (
        <View className="loading">未登录</View>
      ) : (
        <>
          <View className="profile-header">
            <Avatar src={user.avatar} name={user.nickname} size={120} />
            <View className="profile-name">
              <Text className="nickname">{user.nickname || '未设置昵称'}</Text>
              {user.isVerified && <Text className="verified-badge">已认证</Text>}
            </View>
            {user.bio && <Text className="bio">{user.bio}</Text>}
          </View>

          <Card>
            <View className="info-row">
              <Text className="info-label">账号 ID</Text>
              <Text className="info-value">{user.id.slice(0, 8)}...</Text>
            </View>
            {user.phone && (
              <View className="info-row">
                <Text className="info-label">手机号</Text>
                <Text className="info-value">{maskPhone(user.phone)}</Text>
              </View>
            )}
            {user.email && (
              <View className="info-row">
                <Text className="info-label">邮箱</Text>
                <Text className="info-value">{user.email}</Text>
              </View>
            )}
          </Card>

          <Card onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })}>
            <View className="info-row">
              <Text className="info-label">🔔 通知</Text>
              <Text className="info-arrow">›</Text>
            </View>
          </Card>

          <Card>
            <View className="info-row">
              <Text className="info-label faint">📝 完整功能</Text>
              <Text className="info-arrow faint">网页版/App 查看</Text>
            </View>
          </Card>

          <Button className="logout-btn" onClick={onLogout}>
            退出登录
          </Button>
        </>
      )}
    </View>
  );
}

function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}
