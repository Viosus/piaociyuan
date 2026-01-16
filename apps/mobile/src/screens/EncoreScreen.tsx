/**
 * 安可区页面 - 包含私聊群聊和帖子专区两个 Tab
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
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { colors, spacing, fontSize } from '../constants/config';
import { PostCard } from '../components/PostCard';
import { getPosts, likePost, unlikePost, type Post } from '../services/posts';
import { favoritePost, unfavoritePost } from '../services/favorites';
import { getConversations, getUnreadCount, type Conversation, type Message } from '../services/messages';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { SocketEvent } from '../services/socket';
import { getRelativeTime } from '../utils/date';

// 主 Tab 配置
const MAIN_TABS = [
  { label: '私聊群聊', value: 'messages' as const },
  { label: '帖子专区', value: 'posts' as const },
];

// 帖子排序配置
const SORT_TABS = [
  { label: '最新', value: 'latest' as const },
  { label: '热门', value: 'hot' as const },
  { label: '关注', value: 'following' as const },
];

export default function EncoreScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { isConnected, on, off } = useSocket();

  // 主 Tab 状态
  const [activeTab, setActiveTab] = useState<'messages' | 'posts'>('posts');
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialTabSet, setInitialTabSet] = useState(false);

  // 帖子状态
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState<'latest' | 'hot' | 'following'>('latest');
  const [postsError, setPostsError] = useState<string | null>(null);

  // 消息状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);

  // 初始化时检测未读消息，决定默认 Tab
  useEffect(() => {
    checkUnreadAndSetTab();
  }, []);

  const checkUnreadAndSetTab = async () => {
    try {
      const response = await getUnreadCount();
      if (response.ok && response.data) {
        const count = response.data.count;
        setUnreadCount(count);
        // 如果有未读消息，默认显示私聊群聊
        if (count > 0 && !initialTabSet) {
          setActiveTab('messages');
        }
      }
    } catch {
      // 静默处理
    } finally {
      setInitialTabSet(true);
    }
  };

  // 页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      // 刷新未读数
      checkUnreadAndSetTab();

      if (activeTab === 'posts' && posts.length > 0) {
        loadPosts(1, true);
      } else if (activeTab === 'messages' && conversations.length > 0) {
        loadConversations(true);
      }
    }, [activeTab, selectedSort])
  );

  // 加载帖子
  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts(1);
    }
  }, [selectedSort, activeTab]);

  // 加载对话
  useEffect(() => {
    if (activeTab === 'messages') {
      loadConversations();
    }
  }, [activeTab]);

  // Socket 监听
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      updateConversationWithMessage(message);
      setUnreadCount((prev) => prev + 1);
    };

    const handleConversationUpdated = (conversation: Conversation) => {
      updateConversation(conversation);
    };

    if (isConnected) {
      on(SocketEvent.NewMessage, handleNewMessage);
      on(SocketEvent.ConversationUpdated, handleConversationUpdated);
    }

    return () => {
      off(SocketEvent.NewMessage, handleNewMessage);
      off(SocketEvent.ConversationUpdated, handleConversationUpdated);
    };
  }, [isConnected]);

  // ==================== 帖子相关函数 ====================

  const loadPosts = async (pageNum: number = page, silent: boolean = false) => {
    try {
      if (!silent) {
        if (pageNum === 1) {
          setPostsLoading(true);
        }
      }
      setPostsError(null);

      const response = await getPosts({
        page: pageNum,
        limit: 20,
        sort: selectedSort,
      });

      if (response.ok && response.data) {
        const newPosts = response.data;
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
        setHasMore(newPosts.length >= 20);
      } else {
        setPostsError(response.error || '加载帖子失败');
      }
    } catch (err: any) {
      setPostsError(err.message || '加载帖子失败');
    } finally {
      setPostsLoading(false);
      setPostsRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handlePostsRefresh = () => {
    setPostsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadPosts(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !postsLoading && !postsRefreshing) {
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
    (navigation as any).navigate('PostDetail', { postId: post.id });
  };

  const handleLike = async (post: Post) => {
    try {
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
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, isLiked: post.isLiked, likeCount: post.likeCount }
              : p
          )
        );
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: post.isLiked, likeCount: post.likeCount }
            : p
        )
      );
    }
  };

  const handleComment = (post: Post) => {
    (navigation as any).navigate('PostDetail', { postId: post.id, focusComment: true });
  };

  const handleTokenExpired = () => {
    Alert.alert(
      '登录已过期',
      '您的登录状态已过期，请重新登录',
      [{ text: '重新登录', onPress: () => logout() }],
      { cancelable: false }
    );
  };

  const handleFavorite = async (post: Post) => {
    try {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isFavorited: !p.isFavorited } : p
        )
      );

      const response = post.isFavorited
        ? await unfavoritePost(post.id.toString())
        : await favoritePost(post.id.toString());

      if (!response.ok) {
        if ((response as any).code === 'TOKEN_EXPIRED' || response.error?.includes('登录已过期')) {
          handleTokenExpired();
          return;
        }
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, isFavorited: post.isFavorited } : p
          )
        );
      }
    } catch (err: any) {
      if (err.message?.includes('登录已过期') || err.message?.includes('认证')) {
        handleTokenExpired();
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isFavorited: post.isFavorited } : p
        )
      );
    }
  };

  const handleUserPress = (userId: string) => {
    (navigation as any).navigate('UserProfile', { userId });
  };

  const handleEventPress = (eventId: string) => {
    (navigation as any).navigate('EventDetail', { eventId });
  };

  const handleCreatePost = () => {
    (navigation as any).navigate('CreatePost');
  };

  // ==================== 消息相关函数 ====================

  const loadConversations = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setMessagesLoading(true);
      }

      const response = await getConversations(1, 50);
      if (response.ok && response.data) {
        setConversations(response.data);
        // 计算未读数
        const totalUnread = response.data.reduce((sum, c) => sum + c.unreadCount, 0);
        setUnreadCount(totalUnread);
      }
    } catch {
      // 静默处理
    } finally {
      setMessagesLoading(false);
      setMessagesRefreshing(false);
    }
  };

  const handleMessagesRefresh = () => {
    setMessagesRefreshing(true);
    loadConversations();
  };

  const updateConversationWithMessage = (message: Message) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === message.conversationId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: String(message.senderId),
            createdAt: message.createdAt,
            isRead: false,
          },
          unreadCount: updated[index].unreadCount + 1,
          lastMessageAt: message.createdAt,
        };
        updated.unshift(...updated.splice(index, 1));
        return updated;
      }
      return prev;
    });
  };

  const updateConversation = (conversation: Conversation) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversation.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = conversation;
        return updated;
      }
      return [conversation, ...prev];
    });
  };

  const handleConversationPress = (conversation: Conversation) => {
    (navigation as any).navigate('Chat', {
      conversationId: conversation.id,
      isGroup: conversation.type === 'group',
      groupName: conversation.name,
    });
  };

  const handleNewConversation = () => {
    (navigation as any).navigate('SelectUser');
  };

  const handleCreateGroup = () => {
    (navigation as any).navigate('CreateGroup');
  };

  // ==================== 渲染函数 ====================

  const renderMainTabs = () => (
    <View style={styles.mainTabsContainer}>
      <View style={styles.mainTabs}>
        {MAIN_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.mainTab,
              activeTab === tab.value && styles.mainTabActive,
            ]}
            onPress={() => setActiveTab(tab.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.mainTabText,
                activeTab === tab.value && styles.mainTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.value === 'messages' && unreadCount > 0 && (
              <View style={styles.unreadDot}>
                <Text style={styles.unreadDotText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPostsSortTabs = () => (
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

  const renderPostsFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>加载中...</Text>
      </View>
    );
  };

  const renderPostsEmpty = () => {
    if (postsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>暂无帖子</Text>
        <Text style={styles.emptyHint}>成为第一个发帖的人吧</Text>
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isGroup = item.type === 'group';
    const displayName = isGroup ? item.name : item.otherUser?.nickname || '未知用户';
    const displayAvatar = isGroup ? item.avatar : item.otherUser?.avatar;
    const isVerified = !isGroup && item.otherUser?.isVerified;

    let lastMessageText = item.lastMessage?.content || '开始聊天吧';
    if (item.lastMessage?.messageType === 'system') {
      lastMessageText = `[系统消息] ${lastMessageText}`;
    }

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {isGroup ? '👥' : (displayName || '?')[0]}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameRow}>
              {isGroup && <Text style={styles.groupIcon}>👥</Text>}
              <Text style={styles.userName}>{displayName}</Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
              {isGroup && item.memberCount && (
                <Text style={styles.memberCount}>({item.memberCount})</Text>
              )}
            </View>
            <Text style={styles.time}>
              {item.lastMessage
                ? getRelativeTime(new Date(item.lastMessage.createdAt))
                : getRelativeTime(new Date(item.lastMessageAt))}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessagesEmpty = () => {
    if (messagesLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>暂无对话</Text>
        <Text style={styles.emptyHint}>点击右上角开始新的对话</Text>
      </View>
    );
  };

  const renderMessagesHeader = () => (
    <View style={styles.messagesHeaderButtons}>
      <TouchableOpacity style={styles.newButton} onPress={handleCreateGroup}>
        <Text style={styles.newButtonText}>👥 创建群聊</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.newButton} onPress={handleNewConversation}>
        <Text style={styles.newButtonText}>✏️ 新建私聊</Text>
      </TouchableOpacity>
    </View>
  );

  // ==================== 主渲染 ====================

  const renderPostsTab = () => {
    if (postsLoading && posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (postsError && posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>{postsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handlePostsRefresh}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {renderPostsSortTabs()}
        {React.createElement(FlashList as any, {
          data: posts,
          keyExtractor: (item: Post) => item.id.toString(),
          renderItem: ({ item }: { item: Post }) => (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item)}
              onLike={() => handleLike(item)}
              onComment={() => handleComment(item)}
              onFavorite={() => handleFavorite(item)}
              onUserPress={() => handleUserPress(item.userId)}
              onEventPress={() => item.eventId && handleEventPress(item.eventId)}
            />
          ),
          estimatedItemSize: 400,
          ListFooterComponent: renderPostsFooter,
          ListEmptyComponent: renderPostsEmpty,
          contentContainerStyle: styles.listContent,
          refreshControl: (
            <RefreshControl
              refreshing={postsRefreshing}
              onRefresh={handlePostsRefresh}
              colors={[colors.primary]}
            />
          ),
          onEndReached: handleLoadMore,
          onEndReachedThreshold: 0.3,
        })}
        {/* 发帖按钮 */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePost}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonIcon}>✏️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessagesTab = () => {
    if (messagesLoading && conversations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Socket 连接状态提示 */}
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>🔴 未连接到服务器</Text>
          </View>
        )}

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          ListHeaderComponent={renderMessagesHeader}
          ListEmptyComponent={renderMessagesEmpty}
          refreshControl={
            <RefreshControl
              refreshing={messagesRefreshing}
              onRefresh={handleMessagesRefresh}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题和 Tab */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>安可区</Text>
      </View>
      {renderMainTabs()}

      {/* Tab 内容 */}
      {activeTab === 'posts' ? renderPostsTab() : renderMessagesTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  mainTabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mainTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  mainTabActive: {
    backgroundColor: colors.primary,
  },
  mainTabText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mainTabTextActive: {
    color: '#ffffff',
  },
  unreadDot: {
    marginLeft: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyList: {
    flexGrow: 1,
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
  // 消息相关样式
  messagesHeaderButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  newButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  newButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  offlineText: {
    fontSize: fontSize.sm,
    color: '#DC2626',
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: fontSize.xl,
    color: '#fff',
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  time: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.text,
  },
});
