import { View, Text, Image } from '@tarojs/components';
import './EventDetailHeader.scss';

interface EventDetailHeaderProps {
  event: {
    name: string;
    cover?: string | null;
    artist?: string | null;
    date?: string | null;
    time?: string | null;
    city?: string | null;
    venue?: string | null;
    saleStatus?: string;
    category?: string;
  };
}

const STATUS_LABEL: Record<string, string> = {
  on_sale: '售票中',
  not_started: '未开售',
  paused: '暂停售票',
  sold_out: '已售罄',
  ended: '已结束',
};

export default function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const statusKey = event.saleStatus || 'on_sale';
  return (
    <View className="event-header">
      {event.cover ? (
        <Image className="event-banner" src={event.cover} mode="aspectFill" />
      ) : (
        <View className="event-banner event-banner-placeholder">
          <Text className="placeholder-icon">🎫</Text>
        </View>
      )}
      <View className="event-overlay">
        <View className={`event-status status-${statusKey}`}>
          <Text>{STATUS_LABEL[statusKey] || statusKey}</Text>
        </View>
        <Text className="event-name">{event.name}</Text>
        {event.artist && <Text className="event-artist">{event.artist}</Text>}
        <View className="event-meta">
          {(event.date || event.time) && (
            <Text className="meta-line">📅 {event.date} {event.time}</Text>
          )}
          {(event.city || event.venue) && (
            <Text className="meta-line">📍 {event.city} · {event.venue}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
