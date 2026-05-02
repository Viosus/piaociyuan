/**
 * 对话列表页面
 * 使用集中化的 messagingStore 管理会话数据
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, shadows, borderRadius } from '../constants/config';
import type { Conversation } from '../services/messages';
import { useSocket } from '../contexts/SocketContext';
import { useMessagingStore } from '../stores/messagingStore';
import { Avatar } from '../components/Avatar';
import { SkeletonList } from '../components/Skeleton';
import { getRelativeTime } from '../utils/date';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const { isConnected } = useSocket();

  const conversations = useMessagingStore((s) => s.conversations);
  const conversationsLoading = useMessagingStore((s) => s.conversationsLoading);
  const conversationsLoaded = useMessagingStore((s) => s.conversationsLoaded);
  const loadConversations = useMessagingStore((s) => s.loadConversations);

  const [refreshing, setRefreshing] = React.useState(false);

  // 首次加载
  React.useEffect(() => {
    if (!conversationsLoaded) {
      loadConversations();
    }
  }, [conversationsLoaded, loadConversations]);

  // 页面获得焦点时静默刷新数据
  useFocusEffect(
    React.useCallback(() => {
      if (conversationsLoaded) {
        loadConversations(true);
      }
    }, [conversationsLoaded, loadConversations])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations(true);
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      isGroup: conversation.type === 'group',
      groupName: conversation.name,
    });
  };

  const handleNewConversation = () => {
    navigation.navigate('SelectUser');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isGroup = item.type === 'group';

    // 私聊：显示对方信息，群聊：显示群信息
    const displayName = isGroup ? item.name : item.otherUser?.nickname || '未知用户';
    const displayAvatar = isGroup ? item.avatar : item.otherUser?.avatar;
    const isVerified = !isGroup && item.otherUser?.isVerified;

    // 处理最后消息显示
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
          <Avatar
            uri={displayAvatar}
            name={displayName}
            size={56}
            fallbackText={isGroup ? '👥' : undefined}
            showBadge={item.unreadCount > 0}
            badgeContent={item.unreadCount}
          />
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

  const renderEmpty = () => {
    if (conversationsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>暂无对话</Text>
        <Text style={styles.emptyHint}>点击右上角开始新的对话</Text>
      </View>
    );
  };

  if (conversationsLoading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonList rows={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.newButton} onPress={handleCreateGroup}>
            <Text style={styles.newButtonText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newButton} onPress={handleNewConversation}>
            <Text style={styles.newButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Socket 连接状态提示 */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>🔴 未连接到服务器</Text>
        </View>
      )}

      {/* 对话列表 */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={11}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  newButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newButtonText: {
    fontSize: fontSize.lg,
  },
  defaultAvatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: fontSize.xl,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  groupIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  memberCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  offlineBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.error,
  },
  offlineText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surfaceGlass,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs / 2,
    ...shadows.sm,
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
    color: colors.textOnPrimary,
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
    color: colors.textOnPrimary,
    fontWeight: 'bold',
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
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
