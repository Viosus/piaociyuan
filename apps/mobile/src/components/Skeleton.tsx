import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius as br } from '../constants/config';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

/**
 * M-L3 列表行骨架（左圆头像 + 右两行文本），用于会话列表 / 通知列表等
 */
export const SkeletonRow: React.FC = () => (
  <View style={styles.row}>
    <Skeleton width={48} height={48} borderRadius={24} />
    <View style={styles.rowContent}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);

/**
 * 帖子/活动卡片骨架（封面 + 标题 + 副文）
 */
export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton width="100%" height={180} borderRadius={br.md} />
    <View style={{ marginTop: spacing.md }}>
      <Skeleton width="80%" height={16} />
      <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="65%" height={12} style={{ marginTop: 6 }} />
    </View>
  </View>
);

export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ paddingHorizontal: spacing.md }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  card: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: br.md,
    marginBottom: spacing.md,
  },
});
