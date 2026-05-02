/**
 * M-L5 列表回顶悬浮按钮
 *
 * 监听列表 onScroll 的 contentOffset.y，超过 1 屏后显示。
 * 点击调 ref.current.scrollToOffset({ offset: 0, animated: true })。
 *
 * 用法：
 *   const fab = useBackToTopFab(listRef);
 *   <FlatList ref={listRef} onScroll={fab.handleScroll} ... />
 *   <BackToTopFab visible={fab.visible} onPress={fab.scrollToTop} />
 */

import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/config';

const SHOW_THRESHOLD = 600;

interface Scrollable {
  scrollToOffset?: (opts: { offset: number; animated?: boolean }) => void;
}

export function useBackToTopFab<T extends Scrollable>(
  listRef: React.RefObject<T | null>
) {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      setVisible(y > SHOW_THRESHOLD);
    },
    []
  );

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
  }, [listRef]);

  return { visible, handleScroll, scrollToTop };
}

interface BackToTopFabProps {
  visible: boolean;
  onPress: () => void;
  /** 距离底部的偏移，避免被其他 FAB（创建按钮）盖住，默认 88 */
  bottom?: number;
  /** 距离右边的偏移 */
  right?: number;
}

export function BackToTopFab({
  visible,
  onPress,
  bottom = 88,
  right = 24,
}: BackToTopFabProps) {
  if (!visible) return null;

  return (
    <View style={[styles.container, { bottom, right }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel="回到顶部"
        style={styles.fab}
      >
        <Ionicons name="arrow-up" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 30,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});
