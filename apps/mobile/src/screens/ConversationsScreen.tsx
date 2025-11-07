/**
 * 对话列表页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getConversations, type Conversation } from '../services/messages';
import { useSocket } from '../contexts/SocketContext';
import { SocketEvent } from '../services/socket';
import { getRelativeTime } from '../utils/date';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const { isConnected, on, off } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      if (conversations.length > 0) {
        loadConversations(true);
      }
    }, [])
  );

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    // 监听新消息
    const handleNewMessage = (message: any) => {
      console.log('New message received:', message);
      updateConversationWithMessage(message);
    };

    // 监听对话更新
    const handleConversationUpdated = (conversation: Conversation) => {
      console.log('Conversation updated:', conversation);
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

  const loadConversations = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await getConversations(1, 50);
      if (response.ok && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const updateConversationWithMessage = (message: any) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === message.conversationId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          unreadCount: updated[index].unreadCount + 1,
          updatedAt: message.createdAt,
        };
        // 移到列表顶部
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
      } else {
        // 新对话，添加到顶部
        return [conversation, ...prev];
      }
    });
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat' as never, { conversationId: conversation.id } as never);
  };

  const handleNewConversation = () => {
    navigation.navigate('SelectUser' as never);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // 获取对方用户信息（排除自己）
    const otherUser = item.participants[0]; // 简化处理，假设只有两个参与者

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherUser.avatar || 'https://via.placeholder.com/56' }}
            style={styles.avatar}
          />
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
              <Text style={styles.userName}>{otherUser.nickname}</Text>
              {otherUser.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>
              {item.lastMessage
                ? getRelativeTime(new Date(item.lastMessage.createdAt))
                : getRelativeTime(new Date(item.updatedAt))}
            </Text>
          </View>

          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.lastMessage?.content || '开始聊天吧'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>暂无对话</Text>
        <Text style={styles.emptyHint}>点击右上角开始新的对话</Text>
      </View>
    );
  };

  if (loading && conversations.length === 0) {
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
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewConversation}>
          <Text style={styles.newButtonText}>✏️</Text>
        </TouchableOpacity>
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
