/**
 * 聊天页面
 */

import React, { useState, useEffect, useRef } from 'react';
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
  getMessages,
  getConversation,
  sendMessage as sendMessageApi,
  markConversationAsRead,
  type Message,
  type Conversation,
} from '../services/messages';
import { useSocket } from '../contexts/SocketContext';
import { SocketEvent } from '../services/socket';
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

  const { isConnected, sendMessage, sendTyping, sendStopTyping, joinConversation, leaveConversation, on, off } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 在线状态
  const { isUserOnline } = useOnlineStatus(otherUserId ? [otherUserId] : []);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
      markAsRead();

      // 加入对话房间
      if (isConnected) {
        joinConversation(conversationId);
      }
    }

    return () => {
      // 离开对话房间
      if (conversationId && isConnected) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, isConnected]);

  useEffect(() => {
    // 监听新消息
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [message, ...prev]);
        // 标记为已读
        markAsRead();
        // 滚动到底部
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    };

    // 监听对方正在输入
    const handleTyping = (data: { conversationId: string; userId: number }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setOtherUserTyping(true);

        // 清除之前的超时
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // 3秒后自动隐藏
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    };

    // 监听对方停止输入
    const handleStopTyping = (data: { conversationId: string; userId: number }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setOtherUserTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    if (isConnected) {
      on(SocketEvent.NewMessage, handleNewMessage);
      on(SocketEvent.Typing, handleTyping);
      on(SocketEvent.StopTyping, handleStopTyping);
    }

    return () => {
      off(SocketEvent.NewMessage, handleNewMessage);
      off(SocketEvent.Typing, handleTyping);
      off(SocketEvent.StopTyping, handleStopTyping);
    };
  }, [conversationId, currentUserId, isConnected]);

  const loadCurrentUser = async () => {
    try {
      const user = await getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
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

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const response = await getMessages(conversationId, 1, 50);
      if (response.ok && response.data) {
        setMessages(response.data.reverse());
      }
    } catch {
      // 静默处理加载错误
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;

    try {
      await markConversationAsRead(conversationId);
    } catch {
      // 静默处理标记已读错误
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId || sending) return;

    try {
      setSending(true);

      // 通过 Socket 发送（实时）
      if (isConnected) {
        sendMessage(conversationId, content);
      }

      // 同时通过 API 发送（备份）
      const response = await sendMessageApi(conversationId, content);
      if (response.ok && response.data) {
        // 如果 Socket 未连接，手动添加消息
        if (!isConnected) {
          setMessages((prev) => [response.data!, ...prev]);
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }
      } else {
        Alert.alert('错误', response.error || '发送失败');
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
          <TouchableOpacity onPress={() => navigation.navigate('GroupDetail' as never, { groupId: conversationId } as never)}>
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
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
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
});
