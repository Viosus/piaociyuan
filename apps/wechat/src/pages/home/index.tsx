import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import Card from '../../components/Card';
import Empty from '../../components/Empty';
import './index.scss';

interface Event {
  id: number;
  name: string;
  cover: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  artist: string;
  saleStatus: string;
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
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
    const res = await apiClient.get<Event[]>('/api/events');
    if (res.ok && Array.isArray(res.data)) {
      setEvents(res.data);
    }
    setLoading(false);
  };

  const goDetail = (id: number) => {
    // Phase 2 才有 event-detail 页；先 toast 提示
    Taro.showToast({ title: `活动 #${id} 详情页 Phase 2 上线`, icon: 'none' });
  };

  return (
    <ScrollView scrollY className="home-page" enableBackToTop>
      <View className="home-header">
        <Text className="home-title">🎵 热门活动</Text>
        <Text className="home-subtitle">追星就在票次元</Text>
      </View>

      {loading ? (
        <View className="loading">加载中...</View>
      ) : events.length === 0 ? (
        <Empty icon="🎫" title="暂无活动" desc="敬请期待精彩演出上线" />
      ) : (
        <View className="event-list">
          {events.map((e) => (
            <Card key={e.id} onClick={() => goDetail(e.id)}>
              <View className="event-row">
                {e.cover && (
                  <Image className="event-cover" src={e.cover} mode="aspectFill" />
                )}
                <View className="event-info">
                  <Text className="event-name">{e.name}</Text>
                  <Text className="event-artist">{e.artist}</Text>
                  <Text className="event-meta">
                    {e.date} {e.time} · {e.city} {e.venue}
                  </Text>
                  <Text className={`event-status status-${e.saleStatus}`}>
                    {labelStatus(e.saleStatus)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function labelStatus(s: string): string {
  switch (s) {
    case 'on_sale': return '售票中';
    case 'not_started': return '未开售';
    case 'paused': return '暂停售票';
    case 'sold_out': return '已售罄';
    case 'ended': return '已结束';
    default: return s;
  }
}
