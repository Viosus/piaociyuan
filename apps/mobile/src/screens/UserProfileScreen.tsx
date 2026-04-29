/**
 * 用户主页
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getUserProfile, followUser, unfollowUser, getUserPosts, type UserProfile } from '../services/users';
import { PostCard } from '../components/PostCard';
import { Post } from '../services/posts';
import { Avatar } from '../components/Avatar';
import { createConversation } from '../services/messages';
import { useToast } from '../components/Toast';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params as { userId: string };

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadUserProfile();
    loadUserPosts(1);
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await getUserProfile(userId);
      if (response.ok && response.data) {
        setUser(response.data);
        setIsFollowing(response.data.isFollowing || false);
      } else {
        Alert.alert('错误', response.error || '加载用户资料失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载用户资料失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserPosts = async (pageNum: number = page) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getUserPosts(userId, pageNum, 20);
      if (response.ok && response.data) {
        const list = response.data;
        if (pageNum === 1) {
          setPosts(list);
        } else {
          setPosts((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= 20);
      }
    } catch {
      // 静默处理加载错误
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadUserProfile();
    loadUserPosts(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUserPosts(nextPage);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;

    try {
      setFollowLoading(true);
      const response = isFollowing ? await unfollowUser(userId) : await followUser(userId);

      if (response.ok && response.data) {
        setIsFollowing(response.data.isFollowing);

        // 更新粉丝数
        if (user?.stats) {
          setUser({
            ...user,
            stats: {
              ...user.stats,
              followerCount: response.data.isFollowing
                ? user.stats.followerCount + 1
                : user.stats.followerCount - 1,
            },
          });
        }
      } else {
        Alert.alert('错误', response.error || '操作失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (messageLoading) return;
    try {
      setMessageLoading(true);
      const response = await createConversation(userId);
      if (response.ok && response.data?.id) {
        navigation.navigate('Chat', {
          conversationId: response.data.id,
          userId,
        });
      } else {
        toast.error(response.error || '无法发起私聊');
      }
    } catch (e: any) {
      toast.error(e?.message || '无法发起私聊');
    } finally {
      setMessageLoading(false);
    }
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleFollowingPress = () => {
    navigation.navigate('FollowingList', { userId });
  };

  const handleFollowersPress = () => {
    navigation.navigate('FollowerList', { userId });
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>用户不存在</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 用户头像和基本信息 */}
      <View style={styles.userSection}>
        <Avatar uri={user.avatar} name={user.nickname} size={80} elevated />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          {user.location && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}
          {user.website && (
            <Text style={styles.website} numberOfLines={1}>
              🔗 {user.website}
            </Text>
          )}
        </View>
      </View>

      {/* 统计数据 */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
          <Text style={styles.statValue}>{user.stats?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>关注</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
          <Text style={styles.statValue}>{user.stats?.followerCount || 0}</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </TouchableOpacity>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.stats?.postCount || 0}</Text>
          <Text style={styles.statLabel}>帖子</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? colors.primary : '#ffffff'} />
          ) : (
            <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? '已关注' : '关注'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleSendMessage}
          disabled={messageLoading}
        >
          {messageLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.actionButtonText}>私信</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 帖子标题 */}
      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>Ta的帖子</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>加载中...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>暂无帖子</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
        if (isCloseToBottom) {
          handleLoadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      {renderHeader()}

      {/* 帖子列表 */}
      <View style={styles.postsContainer}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPress={() => handlePostPress(post)}
            />
          ))
        ) : (
          renderEmpty()
        )}
        {renderFooter()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  header: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userSection: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nickname: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: fontSize.sm,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: fontSize.sm,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  website: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  followButton: {
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  messageButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  followingButtonText: {
    color: colors.primary,
  },
  postsHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  postsTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  postsContainer: {
    padding: spacing.md,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
