/**
 * 全局 Toast 组件
 * 颜色基调与网页 #46467A 一致
 *
 * 使用：
 *   import { useToast } from '../components/Toast';
 *   const toast = useToast();
 *   toast.success('关注成功');
 *   toast.error('网络错误');
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, fontSize, borderRadius, shadows } from '../constants/config';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  anim: Animated.Value;
}

interface ToastContextValue {
  show: (type: ToastType, message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_BG: Record<ToastType, string> = {
  success: 'rgba(70, 70, 122, 0.95)',  // primary 深紫
  error: 'rgba(176, 60, 100, 0.95)',   // 暖红，与网页 priceCTA 协调
  info: 'rgba(70, 70, 122, 0.95)',
  warning: 'rgba(180, 130, 40, 0.95)',
};

const TYPE_ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
};

let counter = 0;
const nextId = () => `toast_${Date.now()}_${++counter}`;

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        Animated.timing(target.anim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
      return prev;
    });

    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 200);

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, durationMs = 2500) => {
      const id = nextId();
      const anim = new Animated.Value(0);
      setItems((prev) => [...prev, { id, type, message, anim }]);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m, d) => show('success', m, d),
    error: (m, d) => show('error', m, d),
    info: (m, d) => show('info', m, d),
    warning: (m, d) => show('warning', m, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SafeAreaView pointerEvents="box-none" style={styles.layer}>
        <View pointerEvents="box-none" style={styles.stack}>
          {items.map((t) => (
            <TouchableWithoutFeedback key={t.id} onPress={() => dismiss(t.id)}>
              <Animated.View
                style={[
                  styles.toast,
                  {
                    backgroundColor: TYPE_BG[t.type],
                    opacity: t.anim,
                    transform: [
                      {
                        translateY: t.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Text style={styles.icon}>{TYPE_ICON[t.type]}</Text>
                </View>
                <Text style={styles.message} numberOfLines={3}>
                  {t.message}
                </Text>
              </Animated.View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  stack: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    maxWidth: '92%',
    minWidth: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 245, 0.3)',
    ...shadows.lg,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: fontSize.xs + 2,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#ffffff',
    lineHeight: 20,
  },
});
