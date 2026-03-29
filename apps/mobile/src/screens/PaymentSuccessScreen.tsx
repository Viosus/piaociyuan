import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { formatPrice } from '../utils/format';
import { getOrderDetail, type Order } from '../services/orders';

export default function PaymentSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getOrderDetail(orderId);
      if (response.ok && response.data) {
        setOrder(response.data);
      }
    } catch {
      // 静默处理加载订单失败
    } finally {
      setLoading(false);
    }
  };

  const handleViewTickets = () => {
    navigation.navigate('Tickets' as never);
  };

  const handleBackHome = () => {
    navigation.navigate('Home' as never);
  };

  const handleViewOrder = () => {
    navigation.navigate('OrderDetail' as never, { orderId } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 成功图标 */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.iconText}>✓</Text>
          </View>
        </View>

        {/* 成功标题 */}
        <Text style={styles.title}>支付成功</Text>
        <Text style={styles.subtitle}>订单已完成，感谢您的购买！</Text>

        {/* 订单信息 */}
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : order ? (
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订单号</Text>
              <Text style={styles.infoValue}>{order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>支付金额</Text>
              <Text style={styles.amountValue}>
                {formatPrice(order.qty * 100)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>购买数量</Text>
              <Text style={styles.infoValue}>{order.qty} 张</Text>
            </View>
          </View>
        ) : null}

        {/* 提示信息 */}
        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            电子票已生成，您可以在"我的门票"中查看
          </Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewTickets}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>查看门票</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewOrder}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>查看订单</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={handleBackHome}
        >
          <Text style={styles.textButtonText}>返回首页</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  orderInfo: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: 'bold',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipIcon: {
    fontSize: fontSize.lg,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  buttonSection: {
    padding: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  textButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
