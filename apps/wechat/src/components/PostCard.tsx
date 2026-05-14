import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Avatar from './Avatar';
import './PostCard.scss';

interface PostCardPost {
  id: string;
  content: string;
  images?: Array<{ id: string; imageUrl: string }>;
  user: { id: string; nickname: string; avatar: string | null };
  event?: { id: number; name: string; city?: string | null } | null;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: PostCardPost;
}

export default function PostCard({ post }: PostCardProps) {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/post-detail/index?id=${post.id}` });
  };

  const goUserProfile = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    Taro.navigateTo({ url: `/pages/user-profile/index?id=${post.user.id}` });
  };

  const firstImage = post.images?.[0];
  const moreImages = (post.images?.length || 0) > 1;

  return (
    <View className="post-card" onClick={goDetail}>
      <View className="post-head">
        <View className="post-user" onClick={goUserProfile}>
          <Avatar src={post.user.avatar} name={post.user.nickname} size={64} />
          <View className="post-user-info">
            <Text className="post-user-name">{post.user.nickname}</Text>
            <Text className="post-time">{formatTime(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text className="post-content">{post.content}</Text>

      {firstImage && (
        <View className="post-image-wrap">
          <Image className="post-image" src={firstImage.imageUrl} mode="aspectFill" />
          {moreImages && (
            <View className="post-image-count">
              <Text>+{(post.images?.length || 0) - 1}</Text>
            </View>
          )}
        </View>
      )}

      {post.event && (
        <View className="post-event">
          <Text className="event-tag">🎫 {post.event.name}</Text>
        </View>
      )}

      <View className="post-stats">
        <View className="stat-item">
          <Text className="stat-icon">{post.isLiked ? '❤️' : '🤍'}</Text>
          <Text className="stat-num">{post.likeCount}</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-icon">💬</Text>
          <Text className="stat-num">{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

function formatTime(s: string): string {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
