/**
 * 头像组件
 * 视觉与网页统一：紫色 #46467A → #5A5A8E 渐变 + 浅粉 #FFEBF5 边框 + 紫色阴影
 * 无头像时显示首字母（白色），有头像时直接显示图片
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows, GRADIENTS } from '../constants/config';

type AvatarSizePreset = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  uri?: string | null;
  size?: AvatarSizePreset | number;
  name?: string;
  onPress?: () => void;
  showBadge?: boolean;
  badgeContent?: string | number;
  /** 是否显示边框（默认显示，与网页卡片边框统一） */
  bordered?: boolean;
  /** 是否启用阴影 */
  elevated?: boolean;
  /** 自定义占位文本/emoji，覆盖 name 取首字母的默认行为 */
  fallbackText?: string;
}

const SIZE_PRESETS: Record<AvatarSizePreset, number> = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // 中文取第一个字，英文取第一个字母
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 'medium',
  name,
  onPress,
  showBadge = false,
  badgeContent,
  bordered = true,
  elevated = false,
  fallbackText,
}) => {
  const avatarSize = typeof size === 'number' ? size : SIZE_PRESETS[size];
  const initialsFontSize = Math.max(12, Math.round(avatarSize * 0.42));
  const borderWidth = avatarSize >= 64 ? 2 : 1;
  const placeholderText = fallbackText ?? getInitials(name);

  const Container = onPress ? TouchableOpacity : View;

  const containerStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    bordered && {
      borderWidth,
      borderColor: colors.border,
    },
    elevated && shadows.sm,
  ];

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      style={containerStyle}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      ) : (
        <LinearGradient
          colors={GRADIENTS.accent as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: initialsFontSize }]}>
            {placeholderText}
          </Text>
        </LinearGradient>
      )}
      {showBadge && (
        <View style={styles.badge}>
          {badgeContent !== undefined && (
            <Text style={styles.badgeText}>
              {typeof badgeContent === 'number' && badgeContent > 99
                ? '99+'
                : badgeContent}
            </Text>
          )}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.priceCTA,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
