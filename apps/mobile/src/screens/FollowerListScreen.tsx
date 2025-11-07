/**
 * 粉丝列表页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getFollowers, followUser, unfollowUser, type FollowUser } from '../services/users';
import { UserListItem } from '../components/UserListItem';

export default function FollowerListScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params as { userId: number };

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [followLoadingIds, setFollowLoadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadFollowers(1);
  }, [userId]);

  const loadFollowers = async (pageNum: number = page) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getFollowers(userId, pageNum, 20);
      if (response.ok && response.data) {
        if (pageNum === 1) {
          setUsers(response.data);
        } else {
          setUsers((prev) => [...prev, ...response.data]);
        }
        setHasMore(response.data.length >= 20);
      }
    } catch (error) {
      console.error('Load followers error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadFollowers(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFollowers(nextPage);
    }
  };

  const handleFollow = async (user: FollowUser) => {
    if (followLoadingIds.has(user.id)) return;

    try {
      setFollowLoadingIds((prev) => new Set(prev).add(user.id));

      const response = user.isFollowing
        ? await unfollowUser(user.id)
        : await followUser(user.id);

      if (response.ok && response.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, isFollowing: response.data!.isFollowing }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const handleUserPress = (user: FollowUser) => {
    navigation.navigate('UserProfile' as never, { userId: user.id } as never);
  };

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
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyText}>暂无粉丝</Text>
      </View>
    );
  };

  if (loading && users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            onPress={() => handleUserPress(item)}
            onFollow={() => handleFollow(item)}
            followLoading={followLoadingIds.has(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
