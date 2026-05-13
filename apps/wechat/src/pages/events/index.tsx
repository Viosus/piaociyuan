import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import Card from '../../components/Card';
import Empty from '../../components/Empty';
import './index.scss';

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'concert', label: '演唱会' },
  { value: 'festival', label: '音乐节' },
  { value: 'musicale', label: '音乐会' },
  { value: 'exhibition', label: '展览' },
  { value: 'show', label: '演出' },
  { value: 'sports', label: '体育' },
];

interface Event {
  id: number;
  name: string;
  cover: string;
  city: string;
  date: string;
  time: string;
  artist: string;
  category: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    load(category);
  });

  const load = async (cat: string) => {
    setLoading(true);
    const params = cat ? { category: cat } : undefined;
    const res = await apiClient.get<Event[]>('/api/events', { params });
    if (res.ok && Array.isArray(res.data)) {
      setEvents(res.data);
    }
    setLoading(false);
  };

  const onTab = (cat: string) => {
    setCategory(cat);
    load(cat);
  };

  return (
    <View className="events-page">
      <ScrollView scrollX className="cat-bar" enableFlex>
        {CATEGORIES.map((c) => (
          <View
            key={c.value}
            className={`cat-tab ${category === c.value ? 'active' : ''}`}
            onClick={() => onTab(c.value)}
          >
            <Text>{c.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className="events-list" enableBackToTop>
        {loading ? (
          <View className="loading">加载中...</View>
        ) : events.length === 0 ? (
          <Empty icon="🎫" title="该分类下暂无活动" />
        ) : (
          events.map((e) => (
            <Card key={e.id} onClick={() => Taro.showToast({ title: `活动 #${e.id} 详情页 Phase 2`, icon: 'none' })}>
              <View className="event-row">
                {e.cover && (
                  <Image className="event-cover" src={e.cover} mode="aspectFill" />
                )}
                <View className="event-info">
                  <Text className="event-name">{e.name}</Text>
                  <Text className="event-artist">{e.artist}</Text>
                  <Text className="event-meta">
                    {e.date} · {e.city}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
