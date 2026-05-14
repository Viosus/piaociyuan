import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn, getCurrentUser } from '../../services/auth';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import FollowButton from '../../components/FollowButton';
import { toast } from '../../components/Toast';
import './index.scss';

interface UserProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified?: boolean;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  stats?: {
    postCount: number;
    followerCount: number;
    followingCount: number;
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const id = router.params.id;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    if (!id) {
      toast.error('缺少用户 ID');
      Taro.navigateBack();
      return;
    }
    load();
  });

  const load = async () => {
    setLoading(true);
    const res = await apiClient.get<UserProfile>(`/api/user/${id}`);
    if (res.ok && res.data) {
      setProfile(res.data);
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
  };

  const me = getCurrentUser();
  const isSelf = me?.id === id;
  const mutual = !!(profile?.isFollowing && profile?.isFollowedBy);

  const goFollowers = (type: 'followers' | 'following') => {
    if (!id) return;
    Taro.navigateTo({
      url: `/pages/user-followers/index?id=${id}&type=${type}`,
    });
  };

  if (loading) {
    return (
      <View className="profile-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }
  if (!profile) {
    return (
      <View className="profile-page">
        <View className="loading">用户不存在</View>
      </View>
    );
  }

  const stats = profile.stats || { postCount: 0, followerCount: 0, followingCount: 0 };

  return (
    <ScrollView scrollY className="profile-page" enableBackToTop>
      <View className="profile-cover">
        {profile.coverImage ? (
          <Image className="cover-img" src={profile.coverImage} mode="aspectFill" />
        ) : (
          <View className="cover-placeholder" />
        )}
      </View>

      <View className="profile-main">
        <View className="profile-avatar">
          <Avatar src={profile.avatar} name={profile.nickname} size={140} />
        </View>

        <View className="profile-name-row">
          <Text className="profile-nickname">{profile.nickname}</Text>
          {profile.isVerified && (
            <Text className="verified-badge">已认证</Text>
          )}
        </View>

        {!isSelf && profile.isFollowedBy && !mutual && (
          <Text className="ta-followed-hint">TA 关注了你</Text>
        )}

        <View className="profile-stats">
          <View className="stat-item">
            <Text className="stat-num">{stats.postCount}</Text>
            <Text className="stat-label">发帖</Text>
          </View>
          <View
            className="stat-item stat-clickable"
            onClick={() => goFollowers('followers')}
          >
            <Text className="stat-num">{stats.followerCount}</Text>
            <Text className="stat-label">粉丝</Text>
          </View>
          <View
            className="stat-item stat-clickable"
            onClick={() => goFollowers('following')}
          >
            <Text className="stat-num">{stats.followingCount}</Text>
            <Text className="stat-label">关注</Text>
          </View>
        </View>

        {!isSelf && (
          <View className="profile-actions">
            <FollowButton
              userId={profile.id}
              isFollowing={!!profile.isFollowing}
              mutual={mutual}
              onToggle={(next) => {
                setProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        isFollowing: next,
                        stats: prev.stats
                          ? {
                              ...prev.stats,
                              followerCount: prev.stats.followerCount + (next ? 1 : -1),
                            }
                          : prev.stats,
                      }
                    : prev
                );
              }}
            />
          </View>
        )}
      </View>

      {(profile.bio || profile.location || profile.website) && (
        <Card>
          {profile.bio && (
            <View className="info-block">
              <Text className="info-label">简介</Text>
              <Text className="info-value">{profile.bio}</Text>
            </View>
          )}
          {profile.location && (
            <View className="info-block">
              <Text className="info-label">📍 位置</Text>
              <Text className="info-value">{profile.location}</Text>
            </View>
          )}
          {profile.website && (
            <View className="info-block">
              <Text className="info-label">🔗 网站</Text>
              <Text className="info-value">{profile.website}</Text>
            </View>
          )}
        </Card>
      )}

      <Card>
        <Text className="phase-hint-title">📝 帖子区</Text>
        <Text className="phase-hint-desc">
          用户发布的帖子 / 评论 / 点赞 — Phase 2b 上线
        </Text>
      </Card>
    </ScrollView>
  );
}
