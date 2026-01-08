/**
 * 收藏列表页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getFavorites, unfavoritePost } from '../services/favorites';
import { PostCard } from '../components/PostCard';
import { Post } from '../services/posts';

export default function FavoritesScreen() {
  const navigation = useNavigation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      if (posts.length > 0) {
        loadFavorites(1, true);
      }
    }, [])
  );

  useEffect(() => {
    loadFavorites(1);
  }, []);

  const loadFavorites = async (pageNum: number = page, silent: boolean = false) => {
    try {
      if (!silent) {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
      }

      const response = await getFavorites(pageNum, 20);
      if (response.ok && response.data) {
        if (pageNum === 1) {
          setPosts(response.data);
        } else {
          setPosts((prev) => [...prev, ...response.data]);
        }
        setHasMore(response.data.length >= 20);
      }
    } catch (error) {
      console.error('Load favorites error:', error);
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
    loadFavorites(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFavorites(nextPage);
    }
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail' as never, { postId: post.id } as never);
  };

  const handleUnfavorite = async (post: Post) => {
    Alert.alert('提示', '确定要取消收藏吗?', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            const response = await unfavoritePost(post.id);
            if (response.ok) {
              // 从列表中移除
              setPosts((prev) => prev.filter((p) => p.id !== post.id));
            } else {
              Alert.alert('错误', response.error || '取消收藏失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '取消收藏失败');
          }
        },
      },
    ]);
  };

  const handleUserPress = (userId: number) => {
    navigation.navigate('UserProfile' as never, { userId } as never);
  };

  const handleEventPress = (eventId: number) => {
    navigation.navigate('EventDetail' as never, { eventId: eventId } as never);
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
        <Text style={styles.emptyIcon}>🔖</Text>
        <Text style={styles.emptyText}>暂无收藏</Text>
        <Text style={styles.emptyHint}>收藏的帖子会显示在这里</Text>
      </View>
    );
  };

  if (loading && posts.length === 0) {
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
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => handlePostPress(item)}
            onUserPress={() => handleUserPress(item.userId)}
            onEventPress={() => item.eventId && handleEventPress(item.eventId)}
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
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
