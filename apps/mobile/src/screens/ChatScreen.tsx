/**
 * 聊天页面
 * 使用 Zustand messagingStore 集中管理消息状态
 * Socket 事件由 SocketContext 统一处理，此页面仅读取 store 数据
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import {
  getConversation,
  type Message,
  type Conversation,
} from '../services/messages';
import { useSocket } from '../contexts/SocketContext';
import { useMessagingStore } from '../stores/messagingStore';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatErrorMessage } from '../utils/error';
import { getUser } from '../services/storage';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, userId, isGroup, groupName } = route.params as {
    conversationId?: string;
    userId?: number;
    isGroup?: boolean;
    groupName?: string;
  };

  const { isConnected, sendTyping, sendStopTyping, joinConversation, leaveConversation } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // 从 store 读取消息（不再用 useState）
  const messages = useMessagingStore(
    (s) => (conversationId ? s.messagesByConversation[conversationId] || [] : [])
  );

  // 分页状态
  const pagination = useMessagingStore(
    (s) => (conversationId ? s.messagePagination[conversationId] : undefined)
  );

  // 打字状态：从 store 读取，过滤出当前会话中非自己的用户
  const typingUsers = useMessagingStore((s) => s.typingUsers);
  const otherUserTyping = useMemo(() => {
    if (!conversationId || currentUserId === null) return false;
    return Object.entries(typingUsers).some(([key, info]) => {
      return key.startsWith(`${conversationId}_`) && info.userId !== currentUserId;
    });
  }, [typingUsers, conversationId, currentUserId]);

  // Store actions
  const storeLoadMessages = useMessagingStore((s) => s.loadMessages);
  const storeLoadOlderMessages = useMessagingStore((s) => s.loadOlderMessages);
  const storeSetActiveConversation = useMessagingStore((s) => s.setActiveConversation);
  const storeMarkAsRead = useMessagingStore((s) => s.markConversationAsRead);
  const storeAddOptimisticMessage = useMessagingStore((s) => s.addOptimisticMessage);
  const storeReplaceOptimisticMessage = useMessagingStore((s) => s.replaceOptimisticMessage);
  const storeSendMessage = useMessagingStore((s) => s.sendMessage);

  // 在线状态
  const { isUserOnline } = useOnlineStatus(otherUserId ? [otherUserId] : []);

  // 初始化的loading状态由pagination推断
  const loading = pagination?.loading ?? true;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // 设置 activeConversation，加载消息，加入房间
  useEffect(() => {
    if (conversationId) {
      storeSetActiveConversation(conversationId);
      loadConversation();
      storeLoadMessages(conversationId);
      storeMarkAsRead(conversationId);

      // 加入对话房间
      if (isConnected) {
        joinConversation(conversationId);
      }
    }

    return () => {
      // 清除 activeConversation
      storeSetActiveConversation(null);
      // 离开对话房间
      if (conversationId && isConnected) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, isConnected]);

  const loadCurrentUser = async () => {
    try {
      const user = await getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserName(user.nickname || user.username || '');
      }
    } catch {
      // 静默处理，用户未登录时不影响页面
    }
  };

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await getConversation(conversationId);
      if (response.ok && response.data) {
        setConversation(response.data);
        // 设置对方用户 ID（仅私聊）
        if (response.data.otherUser) {
          setOtherUserId(response.data.otherUser.id);
        }
      }
    } catch {
      // 静默处理加载错误
    }
  };

  // 加载更多消息（上拉加载，inverted FlatList 的 onEndReached）
  const handleLoadOlder = useCallback(() => {
    if (conversationId) {
      storeLoadOlderMessages(conversationId);
    }
  }, [conversationId, storeLoadOlderMessages]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || sending || currentUserId === null) return;

    try {
      setSending(true);

      // 1. 乐观添加消息到 store
      const tempId = storeAddOptimisticMessage(
        conversationId,
        content,
        currentUserId,
        currentUserName
      );

      // 滚动到底部
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);

      // 2. 通过 store 的 sendMessage（API 调用）发送
      const realMessage = await storeSendMessage(conversationId, content);

      if (realMessage) {
        // 3. 用真实消息替换临时消息
        storeReplaceOptimisticMessage(conversationId, tempId, realMessage);
      } else {
        Alert.alert('错误', '发送失败');
      }
    } catch (error) {
      Alert.alert('错误', formatErrorMessage(error) || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (conversationId && isConnected) {
      sendTyping(conversationId);
    }
  };

  const handleStopTyping = () => {
    if (conversationId && isConnected) {
      sendStopTyping(conversationId);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === currentUserId;
    const prevMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showTime = !prevMessage ||
      new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5分钟

    // 群聊时显示发送者名称（自己的消息不显示）
    const showSender = isGroup && !isOwn && (!prevMessage || prevMessage.senderId !== item.senderId);

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showTime={showTime}
        showSender={showSender}
      />
    );
  };

  const renderHeader = () => {
    if (!otherUserTyping) return null;
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>对方正在输入...</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!pagination?.loading || messages.length === 0) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>开始聊天吧</Text>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 获取对方用户信息（私聊）
  const otherUser = conversation?.otherUser;
  const isOnline = otherUserId ? isUserOnline(otherUserId) : false;

  // 获取显示名称
  const displayName = isGroup ? (groupName || conversation?.name || '群聊') : (otherUser?.nickname || '聊天');

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            {isGroup && <Text style={styles.groupIcon}>👥</Text>}
            <Text style={styles.headerTitle}>{displayName}</Text>
          </View>
          {!isGroup && isConnected && (
            <Text style={[styles.onlineStatus, isOnline && styles.onlineStatusActive]}>
              {isOnline ? '在线' : '离线'}
            </Text>
          )}
          {isGroup && conversation?.memberCount && (
            <Text style={styles.memberCount}>{conversation.memberCount}人</Text>
          )}
        </View>
        {isGroup ? (
          <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: conversationId })}>
            <Text style={styles.settingsButton}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {/* Socket 连接状态提示 */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>🔴 未连接到服务器，消息可能延迟</Text>
        </View>
      )}

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
        onEndReached={handleLoadOlder}
        onEndReachedThreshold={0.3}
      />

      {/* 消息输入框 */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={sending}
      />
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupIcon: {
    fontSize: fontSize.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  memberCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    fontSize: fontSize.lg,
    padding: spacing.xs,
  },
  onlineStatus: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  onlineStatusActive: {
    color: colors.success,
  },
  offlineBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.error,
  },
  offlineText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
  },
  messageList: {
    paddingVertical: spacing.sm,
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  loadingMore: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
