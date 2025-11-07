import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatPrice } from '../utils/format';
import { getOrderDetail, payOrder, type Order } from '../services/orders';

const PAYMENT_TIMEOUT = 15 * 60 * 1000; // 15分钟

const PAYMENT_METHODS = [
  { id: 'wechat', name: '微信支付', icon: '💚' },
  { id: 'alipay', name: '支付宝', icon: '💙' },
  { id: 'mock', name: '模拟支付', icon: '🎭' },
];

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('mock');
  const [remainingTime, setRemainingTime] = useState(PAYMENT_TIMEOUT);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadOrderDetail();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    // 倒计时
    if (order && order.status === 'pending') {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            Alert.alert('订单已过期', '支付超时，订单已自动取消', [
              {
                text: '返回',
                onPress: () => navigation.goBack(),
              },
            ]);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [order]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOrderDetail(orderId);
      if (response.ok && response.data) {
        setOrder(response.data);

        // 如果订单已支付，直接跳转到成功页
        if (response.data.status === 'paid') {
          navigation.replace('PaymentSuccess' as never, { orderId } as never);
        }
      } else {
        setError(response.error || '加载订单详情失败');
      }
    } catch (err: any) {
      setError(err.message || '加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;

    try {
      setPaying(true);

      // 调用支付API
      const response = await payOrder(orderId);

      if (response.ok) {
        // 支付成功，跳转到成功页
        navigation.replace('PaymentSuccess' as never, { orderId } as never);
      } else {
        Alert.alert('支付失败', response.error || '支付失败，请重试');
      }
    } catch (err: any) {
      Alert.alert('支付失败', err.message || '支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message={error} onRetry={loadOrderDetail} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message="订单不存在" onRetry={loadOrderDetail} />
      </SafeAreaView>
    );
  }

  // 计算总金额
  const totalAmount = order.qty * 100; // 这里假设从订单获取金额，实际应该有 order.amount

  return (
    <SafeAreaView style={styles.container}>
      {/* 倒计时提示 */}
      <View style={styles.timerBar}>
        <Text style={styles.timerIcon}>⏰</Text>
        <Text style={styles.timerText}>
          请在 <Text style={styles.timerValue}>{formatTime(remainingTime)}</Text> 内完成支付
        </Text>
      </View>

      {/* 订单金额 */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>订单金额</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountSymbol}>¥</Text>
          <Text style={styles.amountValue}>{totalAmount}</Text>
        </View>
        <Text style={styles.orderIdText}>订单号：{order.id}</Text>
      </View>

      {/* 支付方式选择 */}
      <View style={styles.methodSection}>
        <Text style={styles.methodTitle}>选择支付方式</Text>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodItem,
              selectedMethod === method.id && styles.methodItemActive,
            ]}
            onPress={() => setSelectedMethod(method.id)}
            activeOpacity={0.7}
          >
            <View style={styles.methodLeft}>
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={styles.methodName}>{method.name}</Text>
            </View>
            <View
              style={[
                styles.methodRadio,
                selectedMethod === method.id && styles.methodRadioActive,
              ]}
            >
              {selectedMethod === method.id && (
                <View style={styles.methodRadioDot} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 支付按钮 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.payButton, paying && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.8}
        >
          {paying ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.payButtonText}>
              立即支付 {formatPrice(totalAmount)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>取消支付</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  timerBar: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  timerIcon: {
    fontSize: fontSize.lg,
  },
  timerText: {
    fontSize: fontSize.sm,
    color: '#856404',
  },
  timerValue: {
    fontWeight: 'bold',
    color: colors.error,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  amountLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  amountSymbol: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderIdText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  methodSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  methodTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  methodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  methodItemActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  methodIcon: {
    fontSize: fontSize.xxl,
  },
  methodName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodRadioActive: {
    borderColor: colors.primary,
  },
  methodRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
