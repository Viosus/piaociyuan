import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import { apiClient } from '../services/api';
import { toast } from './Toast';
import './FollowButton.scss';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  mutual?: boolean;
  onToggle?: (newState: boolean) => void;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  userId,
  isFollowing,
  mutual = false,
  onToggle,
  size = 'md',
}: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleTap = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    if (loading) return;

    const next = !following;
    // 乐观更新
    setFollowing(next);
    setLoading(true);

    const method = next ? 'post' : 'delete';
    const res =
      method === 'post'
        ? await apiClient.post(`/api/users/${userId}/follow`)
        : await apiClient.delete(`/api/users/${userId}/follow`);

    setLoading(false);

    if (res.ok) {
      onToggle?.(next);
      if (next) toast.success('已关注');
      else toast.info('已取消关注');
    } else {
      // 失败回滚
      setFollowing(!next);
      toast.error(res.error || '操作失败');
    }
  };

  const label = following ? (mutual ? '互相关注' : '已关注') : '关注';
  const variantClass = following ? 'followed' : 'follow';

  return (
    <View
      className={`follow-btn ${variantClass} size-${size}`}
      onClick={handleTap}
    >
      <Text>{loading ? '...' : label}</Text>
    </View>
  );
}
