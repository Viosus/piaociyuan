import { View, Image, Text } from '@tarojs/components';
import './Avatar.scss';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number; // rpx
}

export default function Avatar({ src, name, size = 80 }: AvatarProps) {
  const style = { width: `${size}rpx`, height: `${size}rpx` };
  if (src) {
    return (
      <Image className="avatar" src={src} style={style} mode="aspectFill" />
    );
  }
  const letter = (name && name[0]) || '?';
  return (
    <View className="avatar avatar-fallback" style={style}>
      <Text className="avatar-letter">{letter}</Text>
    </View>
  );
}
