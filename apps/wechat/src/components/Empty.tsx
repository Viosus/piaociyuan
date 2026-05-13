import { View, Text } from '@tarojs/components';
import './Empty.scss';

interface EmptyProps {
  icon?: string;
  title?: string;
  desc?: string;
}

export default function Empty({ icon = '📭', title = '暂无内容', desc }: EmptyProps) {
  return (
    <View className="empty">
      <Text className="empty-icon">{icon}</Text>
      <Text className="empty-title">{title}</Text>
      {desc && <Text className="empty-desc">{desc}</Text>}
    </View>
  );
}
