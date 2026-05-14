import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import { apiClient } from '../services/api';
import { toast } from './Toast';
import './FavoriteButton.scss';

interface FavoriteButtonProps {
  postId: string;
  isFavorited: boolean;
}

/**
 * 收藏按钮：API 是 POST 加 / DELETE 减（不是幂等 toggle）
 * UI 仍走乐观更新，失败回滚
 */
export default function FavoriteButton({ postId, isFavorited }: FavoriteButtonProps) {
  const [fav, setFav] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleTap = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    if (loading) return;

    const prev = fav;
    const next = !fav;
    setFav(next);
    setLoading(true);

    const res = next
      ? await apiClient.post(`/api/posts/${postId}/favorite`)
      : await apiClient.delete(`/api/posts/${postId}/favorite`);

    setLoading(false);

    if (res.ok) {
      toast.info(next ? '已收藏' : '已取消收藏');
    } else {
      setFav(prev);
      toast.error(res.error || '操作失败');
    }
  };

  return (
    <View className={`fav-btn ${fav ? 'favorited' : ''}`} onClick={handleTap}>
      <Text className="fav-icon">{fav ? '🔖' : '📑'}</Text>
      <Text className="fav-label">{fav ? '已收藏' : '收藏'}</Text>
    </View>
  );
}
