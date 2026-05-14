import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import { apiClient } from '../services/api';
import { toast } from './Toast';
import './LikeButton.scss';

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  count: number;
}

export default function LikeButton({ postId, isLiked, count }: LikeButtonProps) {
  const [liked, setLiked] = useState(isLiked);
  const [num, setNum] = useState(count);
  const [loading, setLoading] = useState(false);

  const handleTap = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    if (loading) return;

    // 乐观更新
    const prevLiked = liked;
    const prevNum = num;
    const next = !liked;
    setLiked(next);
    setNum(num + (next ? 1 : -1));
    setLoading(true);

    const res = await apiClient.post<{ isLiked: boolean; likeCount: number }>(
      `/api/posts/${postId}/like`
    );

    setLoading(false);

    if (res.ok && res.data) {
      // 用后端权威数据校正
      setLiked(res.data.isLiked);
      setNum(res.data.likeCount);
    } else {
      // 失败回滚
      setLiked(prevLiked);
      setNum(prevNum);
      toast.error(res.error || '操作失败');
    }
  };

  return (
    <View className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleTap}>
      <Text className="like-icon">{liked ? '❤️' : '🤍'}</Text>
      <Text className="like-count">{num}</Text>
    </View>
  );
}
