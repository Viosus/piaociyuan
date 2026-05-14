import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import EventDetailHeader from '../../components/EventDetailHeader';
import Card from '../../components/Card';
import { toast } from '../../components/Toast';
import './index.scss';

interface Tier {
  id: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
}

interface EventDetail {
  id: number;
  name: string;
  cover: string;
  artist: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  desc: string;
  saleStatus: string;
  category: string;
  tiers?: Tier[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const id = router.params.id;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    if (!id) {
      toast.error('缺少活动 ID');
      Taro.navigateBack();
      return;
    }
    load();
  });

  const load = async () => {
    setLoading(true);
    const res = await apiClient.get<EventDetail>(`/api/events/${id}`);
    if (res.ok && res.data) {
      setEvent(res.data);
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
  };

  const handleBuy = (tier: Tier) => {
    Taro.showToast({
      title: `${tier.name} 购票 Phase 4 上线`,
      icon: 'none',
      duration: 1800,
    });
  };

  if (loading) {
    return (
      <View className="event-detail-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="event-detail-page">
        <View className="loading">活动不存在</View>
      </View>
    );
  }

  const onSale = event.saleStatus === 'on_sale';

  return (
    <ScrollView scrollY className="event-detail-page" enableBackToTop>
      <EventDetailHeader event={event} />

      {event.desc && (
        <Card>
          <Text className="section-title">活动简介</Text>
          <Text className="event-desc">{event.desc}</Text>
        </Card>
      )}

      <Card>
        <Text className="section-title">票档</Text>
        {!event.tiers || event.tiers.length === 0 ? (
          <Text className="no-tier">暂无票档信息</Text>
        ) : (
          <View className="tier-list">
            {event.tiers.map((t) => (
              <View key={t.id} className="tier-row">
                <View className="tier-info">
                  <Text className="tier-name">{t.name}</Text>
                  <Text className="tier-stock">
                    余 {t.remaining} / 共 {t.capacity}
                  </Text>
                </View>
                <View className="tier-action">
                  <Text className="tier-price">¥{t.price}</Text>
                  <View
                    className={`tier-btn ${onSale && t.remaining > 0 ? '' : 'tier-btn-disabled'}`}
                    onClick={() => onSale && t.remaining > 0 && handleBuy(t)}
                  >
                    <Text>{onSale && t.remaining > 0 ? '购票' : '已售罄'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      <View className="phase-hint">
        💳 在线支付 / 票务详情 / 转赠 — Phase 4 上线
      </View>
    </ScrollView>
  );
}
