/**
 * 消息气泡组件
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, shadows } from '../constants/config';
import { Message } from '../services/messages';
import { getTimeString } from '../utils/date';
import { APP_CONFIG } from '../constants/config';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  showSender?: boolean;
}

/**
 * 把后端返回的相对路径（/uploads/... / /test-covers/...）补全成可访问 URL
 */
function resolveImageUrl(content: string): string {
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content;
  }
  // 同源相对路径，前缀 API_URL（去掉尾部 /）
  const base = APP_CONFIG.API_URL.replace(/\/$/, '');
  return base + (content.startsWith('/') ? content : '/' + content);
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTime = false,
  showSender = false,
}) => {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const isImage = message.messageType === 'image';
  const imageUrl = isImage ? resolveImageUrl(message.content) : '';

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
        {isImage ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLightboxOpen(true)}
            style={styles.imageBubble}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.imageThumb}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {message.content}
            </Text>
          </View>
        )}
      </View>

      {/* 已读状态（仅自己的消息） */}
      {isOwn && (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{message.isRead ? '已读' : '未读'}</Text>
        </View>
      )}

      {/* 大图查看 */}
      {isImage && (
        <Modal
          visible={lightboxOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLightboxOpen(false)}
        >
          <View style={styles.lightboxOverlay}>
            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setLightboxOpen(false)}
              accessibilityLabel="关闭"
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lightboxBackdrop}
              activeOpacity={1}
              onPress={() => setLightboxOpen(false)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.lightboxImage}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>
        </Modal>
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
  imageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageThumb: {
    width: 220,
    height: 220,
    backgroundColor: '#0001',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: '95%',
    height: '95%',
  },
  lightboxClose: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
