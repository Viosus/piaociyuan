import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import Empty from '../../components/Empty';
import './index.scss';

type Tab = 'user' | 'post' | 'event';

interface UserResult {
  id: string;
  nickname: string;
  avatar: string | null;
  bio?: string | null;
  followerCount?: number;
}
interface PostResult {
  id: string;
  content: string;
  user: { id: string; nickname: string; avatar: string | null };
  createdAt: string;
}
interface EventResult {
  id: number;
  name: string;
  cover: string;
  city: string;
  date: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('user');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
    }
  });

  const search = async (q: string) => {
    if (q.trim().length < 1) {
      setUsers([]); setPosts([]); setEvents([]);
      return;
    }
    setLoading(true);
    const res = await apiClient.get<{ users: UserResult[]; posts: PostResult[]; events: EventResult[] }>(
      '/api/search',
      { params: { q: q.trim() } }
    );
    if (res.ok && res.data) {
      setUsers(res.data.users || []);
      setPosts(res.data.posts || []);
      setEvents(res.data.events || []);
    }
    setLoading(false);
  };

  return (
    <View className="search-page">
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜用户 / 帖子 / 活动"
          value={query}
          onInput={(e) => setQuery(e.detail.value)}
          onConfirm={() => search(query)}
          confirmType="search"
        />
      </View>

      <View className="tab-bar">
        {(['user', 'post', 'event'] as Tab[]).map((t) => (
          <View
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            <Text>{t === 'user' ? `用户 (${users.length})` : t === 'post' ? `帖子 (${posts.length})` : `活动 (${events.length})`}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className="search-list" enableBackToTop>
        {loading ? (
          <View className="loading">搜索中...</View>
        ) : tab === 'user' ? (
          users.length === 0 ? <Empty icon="🔍" title="未找到用户" /> :
          users.map((u) => (
            <Card key={u.id}>
              <View className="user-row">
                <Avatar src={u.avatar} name={u.nickname} size={80} />
                <View className="user-info">
                  <Text className="user-name">{u.nickname}</Text>
                  {u.bio && <Text className="user-bio">{u.bio}</Text>}
                  {typeof u.followerCount === 'number' && (
                    <Text className="user-meta">{u.followerCount} 粉丝</Text>
                  )}
                </View>
              </View>
            </Card>
          ))
        ) : tab === 'post' ? (
          posts.length === 0 ? <Empty icon="📝" title="未找到帖子" /> :
          posts.map((p) => (
            <Card key={p.id}>
              <View className="post-head">
                <Avatar src={p.user.avatar} name={p.user.nickname} size={60} />
                <Text className="post-author">{p.user.nickname}</Text>
              </View>
              <Text className="post-content">{p.content}</Text>
            </Card>
          ))
        ) : (
          events.length === 0 ? <Empty icon="🎫" title="未找到活动" /> :
          events.map((e) => (
            <Card key={e.id}>
              <View className="event-row">
                {e.cover && <Image className="event-cover" src={e.cover} mode="aspectFill" />}
                <View className="event-info">
                  <Text className="event-name">{e.name}</Text>
                  <Text className="event-meta">{e.date} · {e.city}</Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
