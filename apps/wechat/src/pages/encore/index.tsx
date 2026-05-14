import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import PostCard from '../../components/PostCard';
import Empty from '../../components/Empty';
import { toast } from '../../components/Toast';
import './index.scss';

type Sort = 'latest' | 'hot' | 'following';

interface PostItem {
  id: string;
  content: string;
  images?: Array<{ id: string; imageUrl: string }>;
  user: { id: string; nickname: string; avatar: string | null };
  event?: { id: number; name: string; city?: string | null } | null;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
}

const SORT_TABS: Array<{ key: Sort; label: string }> = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '热门' },
  { key: 'following', label: '关注' },
];

export default function EncorePage() {
  const [sort, setSort] = useState<Sort>('latest');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    if (posts.length === 0) {
      fetchPage(1, sort, true);
    }
  });

  const fetchPage = async (
    pageNum: number,
    sortKey: Sort,
    replace = false
  ) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const res = await apiClient.get<PostItem[]>('/api/posts', {
      params: { page: pageNum, pageSize: 20, sort: sortKey },
    });

    if (res.ok) {
      // 兼容裸数组或 { data, pagination }
      const list = Array.isArray(res.data) ? res.data : ((res.data as { data?: PostItem[] } | undefined)?.data || []);
      setPosts((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(list.length >= 20);
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleTab = (k: Sort) => {
    if (k === sort) return;
    setSort(k);
    setPage(1);
    setPosts([]);
    setHasMore(true);
    fetchPage(1, k, true);
  };

  usePullDownRefresh(() => {
    setPage(1);
    fetchPage(1, sort, true).finally(() => Taro.stopPullDownRefresh());
  });

  useReachBottom(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, sort);
  });

  return (
    <View className="encore-page">
      <View className="sort-bar">
        {SORT_TABS.map((t) => (
          <View
            key={t.key}
            className={`sort-tab ${sort === t.key ? 'active' : ''}`}
            onClick={() => handleTab(t.key)}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      <View className="post-list">
        {loading ? (
          <View className="loading">加载中...</View>
        ) : posts.length === 0 ? (
          <Empty icon="📝" title="暂无帖子" desc={sort === 'following' ? '关注的人还没发帖' : '快来发第一帖吧'} />
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
            {loadingMore && <View className="loading-more">加载中...</View>}
            {!hasMore && <View className="end-hint">— 没有更多了 —</View>}
          </>
        )}
      </View>
    </View>
  );
}
