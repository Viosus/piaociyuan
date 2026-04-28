/**
 * 消息气泡组件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, shadows } from '../constants/config';
import { Message } from '../services/messages';
import { getTimeString } from '../utils/date';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  showSender?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTime = false,
  showSender = false,
}) => {
  return (
    <View style={styles.container}>
      {/* 时间戳 */}
      {showTime && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{getTimeString(new Date(message.createdAt))}</Text>
        </View>
      )}

      {/* 发送者名称（群聊） */}
      {showSender && message.sender && (
        <Text style={styles.senderName}>{message.sender.nickname}</Text>
      )}

      {/* 消息气泡 */}
      <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
        </View>
      </View>

      {/* 已读状态（仅自己的消息） */}
      {isOwn && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{message.isRead ? '已读' : '未读'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  timeContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  senderName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  bubbleRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceGlass,
    borderTopLeftRadius: 4,
    ...shadows.sm,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    ...shadows.sm,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: colors.textOnPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
