/**
 * 消息输入框组件
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, shadows } from '../constants/config';
import { apiClient } from '../services/api';

interface MessageInputProps {
  onSend: (message: string) => void;
  /** 发图：上传后的同源 URL，调用方调 sendMessage(content, 'image') */
  onSendImage?: (imageUrl: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onSendImage,
  onTyping,
  onStopTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const pickAndSendImage = async () => {
    if (!onSendImage || uploading) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('权限不足', '请允许访问照片库以发送图片');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);
      const asset = result.assets[0];
      // 用 RN FormData 通过 apiClient 上传
      const form = new FormData();
      // RN: file uri + name + type
      const fileExt = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append('file', {
        uri: asset.uri,
        name: `chat-${Date.now()}.${fileExt}`,
        type: asset.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      } as unknown as Blob);

      const res = await apiClient.request<{ imageUrl: string }>('/api/upload', {
        method: 'POST',
        body: form,
        // 让 fetch 自动设 multipart boundary
        headers: {},
      });

      if (res.ok && res.data?.imageUrl) {
        onSendImage(res.data.imageUrl);
      } else {
        Alert.alert('发送失败', res.error || '上传图片失败');
      }
    } catch (err) {
      Alert.alert('发送失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setUploading(false);
    }
  };

  const handleChangeText = (text: string) => {
    setMessage(text);

    // 发送正在输入状态
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      onTyping?.();
    }

    // 清除之前的超时
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // 设置新的超时，2秒后停止输入状态
    if (text.length > 0) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        onStopTyping?.();
      }, 2000);
      setTypingTimeout(timeout);
    } else {
      setIsTyping(false);
      onStopTyping?.();
    }
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) return;

    onSend(trimmedMessage);
    setMessage('');
    setIsTyping(false);
    onStopTyping?.();

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {onSendImage && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickAndSendImage}
            disabled={disabled || uploading}
            accessibilityLabel="发送图片"
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          placeholder="说点什么..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={handleChangeText}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim().length === 0 && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={disabled || message.trim().length === 0}
        >
          <Text style={styles.sendButtonText}>发送</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.surfaceGlass,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceGlassTint,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
});
