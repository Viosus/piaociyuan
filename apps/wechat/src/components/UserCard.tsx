import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Avatar from './Avatar';
import FollowButton from './FollowButton';
import { getCurrentUser } from '../services/auth';
import './UserCard.scss';

interface UserCardUser {
  id: string;
  nickname: string;
  avatar: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  isVerified?: boolean;
}

interface UserCardProps {
  user: UserCardUser;
  showFollow?: boolean;
}

export default function UserCard({ user, showFollow = true }: UserCardProps) {
  const me = getCurrentUser();
  const isSelf = me?.id === user.id;

  const goProfile = () => {
    Taro.navigateTo({ url: `/pages/user-profile/index?id=${user.id}` });
  };

  return (
    <View className="user-card" onClick={goProfile}>
      <Avatar src={user.avatar} name={user.nickname} size={88} />
      <View className="user-card-info">
        <View className="user-card-name">
          <Text className="nickname">{user.nickname}</Text>
          {user.isVerified && <Text className="verified-dot">✓</Text>}
        </View>
        {user.bio && <Text className="bio">{user.bio}</Text>}
      </View>
      {showFollow && !isSelf && (
        <FollowButton
          userId={user.id}
          isFollowing={!!user.isFollowing}
          size="sm"
        />
      )}
    </View>
  );
}
