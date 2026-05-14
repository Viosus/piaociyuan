import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useReachBottom, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import UserCard from '../../components/UserCard';
import Empty from '../../components/Empty';
import { toast } from '../../components/Toast';
import './index.scss';

interface ListUser {
  id: string;
  nickname: string;
  avatar: string | null;
  bio?: string | null;
  isVerified?: boolean;
  isFollowing?: boolean;
}

export default function UserFollowersPage() {
  const router = useRouter();
  const id = router.params.id;
  const type = (router.params.type as 'followers' | 'following') || 'followers';

  const [users, setUsers] = useState<ListUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    if (!id) {
      toast.error('缺少用户 ID');
      Taro.navigateBack();
      return;
    }
    // 初次进入：拉第 1 页
    setUsers([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);

    Taro.setNavigationBarTitle({
      title: type === 'followers' ? '粉丝' : '关注',
    });
  });

  const fetchPage = async (pageNum: number, replace = false) => {
    if (!id) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const endpoint = `/api/user/${id}/${type}`;
    const res = await apiClient.get<{
      followers?: ListUser[];
      followings?: ListUser[];
      hasMore: boolean;
    }>(endpoint, { params: { page: pageNum, limit: 20 } });

    if (res.ok && res.data) {
      const list =
        (type === 'followers' ? res.data.followers : res.data.followings) || [];
      setUsers((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(!!res.data.hasMore);
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useReachBottom(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  });

  return (
    <View className="followers-page">
      <View className="followers-header">
        <Text className="header-title">
          {type === 'followers' ? '👥 粉丝' : '➡️ 关注'}（{users.length}）
        </Text>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : users.length === 0 ? (
        <Empty
          icon={type === 'followers' ? '👥' : '➡️'}
          title={type === 'followers' ? '还没有粉丝' : '还没关注谁'}
        />
      ) : (
        <View className="user-list">
          {users.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
          {loadingMore && <View className="loading-more">加载更多...</View>}
          {!hasMore && users.length > 0 && (
            <View className="end-hint">— 没有更多了 —</View>
          )}
        </View>
      )}
    </View>
  );
}
