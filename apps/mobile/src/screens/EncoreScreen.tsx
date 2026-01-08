/**
 * 安可区（帖子列表）页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { colors, spacing, fontSize } from '../constants/config';
import { PostCard } from '../components/PostCard';
import { getPosts, likePost, unlikePost, type Post } from '../services/posts';
import { favoritePost, unfavoritePost } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';

const SORT_TABS = [
  { label: '最新', value: 'latest' as const },
  { label: '热门', value: 'hot' as const },
  { label: '关注', value: 'following' as const },
];

export default function EncoreScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState<'latest' | 'hot' | 'following'>('latest');
  const [error, setError] = useState<string | null>(null);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      if (posts.length > 0) {
        // 如果已经有数据，静默刷新第一页
        loadPosts(1, true);
      }
    }, [selectedSort])
  );

  useEffect(() => {
    loadPosts(1);
  }, [selectedSort]);

  const loadPosts = async (pageNum: number = page, silent: boolean = false) => {
    try {
      if (!silent) {
        if (pageNum === 1) {
          setLoading(true);
        }
      }
      setError(null);

      const response = await getPosts({
        page: pageNum,
        limit: 20,
        sort: selectedSort,
      });

      if (response.ok && response.data) {
        if (pageNum === 1) {
          setPosts(response.data);
        } else {
          setPosts((prev) => [...prev, ...response.data]);
        }
        // 如果返回的数据少于 20 条，说明没有更多了
        setHasMore(response.data.length >= 20);
      } else {
        setError(response.error || '加载帖子失败');
      }
    } catch (err: any) {
      setError(err.message || '加载帖子失败');
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
    loadPosts(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  };

  const handleSortChange = (sort: 'latest' | 'hot' | 'following') => {
    setSelectedSort(sort);
    setPage(1);
    setHasMore(true);
    setPosts([]);
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail' as never, { postId: post.id } as never);
  };

  const handleLike = async (post: Post) => {
    try {
      // 乐观更新
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                isLiked: !p.isLiked,
                likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      );

      const response = post.isLiked ? await unlikePost(post.id) : await likePost(post.id);
      if (!response.ok) {
        // 如果失败，回滚
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isLiked: post.isLiked,
                  likeCount: post.likeCount,
                }
              : p
          )
        );
      }
    } catch (err) {
      // 出错时回滚
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                isLiked: post.isLiked,
                likeCount: post.likeCount,
              }
            : p
        )
      );
    }
  };

  const handleComment = (post: Post) => {
    navigation.navigate('PostDetail' as never, { postId: post.id, focusComment: true } as never);
  };

  const handleTokenExpired = () => {
    Alert.alert(
      '登录已过期',
      '您的登录状态已过期，请重新登录',
      [
        {
          text: '重新登录',
          onPress: async () => {
            try {
              await logout();
              // 导航到登录页面
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('退出登录失败:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleFavorite = async (post: Post) => {
    try {
      // 乐观更新
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                isFavorited: !p.isFavorited,
              }
            : p
        )
      );

      const response = post.isFavorited
        ? await unfavoritePost(post.id.toString())
        : await favoritePost(post.id.toString());

      if (!response.ok) {
        // 检查是否是登录过期错误
        if (response.code === 'TOKEN_EXPIRED' || response.error?.includes('登录已过期')) {
          handleTokenExpired();
          return;
        }

        // 如果失败，回滚
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  isFavorited: post.isFavorited,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      // 检查是否是登录过期错误
      if (err.message?.includes('登录已过期') || err.message?.includes('认证')) {
        handleTokenExpired();
        return;
      }

      // 出错时回滚
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                isFavorited: post.isFavorited,
              }
            : p
        )
      );
    }
  };

  const handleUserPress = (userId: number) => {
    navigation.navigate('UserProfile' as never, { userId } as never);
  };

  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetail' as never, { eventId: eventId } as never);
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost' as never);
  };

  const renderHeader = () => (
    <View style={styles.sortTabs}>
      {SORT_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={[
            styles.sortTab,
            selectedSort === tab.value && styles.sortTabActive,
          ]}
          onPress={() => handleSortChange(tab.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.sortTabText,
              selectedSort === tab.value && styles.sortTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
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
        <Text style={styles.emptyHint}>成为第一个发帖的人吧</Text>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlashList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => handlePostPress(item)}
            onLike={() => handleLike(item)}
            onComment={() => handleComment(item)}
            onFavorite={() => handleFavorite(item)}
            onUserPress={() => handleUserPress(item.userId)}
            onEventPress={() => item.eventId && handleEventPress(item.eventId)}
          />
        )}
        estimatedItemSize={400}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
      />

      {/* 发帖按钮 */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonIcon}>✏️</Text>
      </TouchableOpacity>
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
  sortTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
  },
  sortTabActive: {
    backgroundColor: colors.primary,
  },
  sortTabText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 80,
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
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  createButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonIcon: {
    fontSize: 24,
  },
});
