import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatPrice } from '../utils/format';
import { formatDateTime } from '../utils/date';
import { getOrderDetail, cancelOrder, refundOrder, type Order } from '../services/orders';

// 订单状态配置
const ORDER_STATUS_CONFIG = {
  pending: { label: '待支付', color: colors.warning, icon: '⏳' },
  paid: { label: '已支付', color: colors.success, icon: '✓' },
  cancelled: { label: '已取消', color: colors.textSecondary, icon: '✕' },
  refunded: { label: '已退款', color: colors.error, icon: '↩' },
};

export default function OrderDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOrderDetail(orderId);
      if (response.ok && response.data) {
        setOrder(response.data);
      } else {
        setError(response.error || '加载订单详情失败');
      }
    } catch (err: any) {
      setError(err.message || '加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (!order) return;
    navigation.navigate('Payment' as never, { orderId: order.id } as never);
  };

  const handleCancel = () => {
    Alert.alert('取消订单', '确定要取消这个订单吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确定取消',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            const response = await cancelOrder(orderId);
            if (response.ok) {
              Alert.alert('成功', '订单已取消');
              loadOrderDetail();
            } else {
              Alert.alert('失败', response.error || '取消订单失败');
            }
          } catch (err: any) {
            Alert.alert('错误', err.message || '取消订单失败');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleRefund = () => {
    Alert.alert('申请退款', '确定要申请退款吗？退款后门票将失效。', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确定退款',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            const response = await refundOrder(orderId);
            if (response.ok) {
              Alert.alert('成功', '退款申请已提交');
              loadOrderDetail();
            } else {
              Alert.alert('失败', response.error || '申请退款失败');
            }
          } catch (err: any) {
            Alert.alert('错误', err.message || '申请退款失败');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleViewTickets = () => {
    navigation.navigate('Tickets' as never);
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

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || {
    label: order.status,
    color: colors.textSecondary,
    icon: '?',
  };

  const totalAmount = order.qty * 100; // 假设从订单获取金额

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 订单状态 */}
        <View style={[styles.statusCard, { backgroundColor: `${statusConfig.color}15` }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          {order.status === 'pending' && (
            <Text style={styles.statusTip}>请尽快完成支付，订单将在15分钟后自动取消</Text>
          )}
          {order.status === 'paid' && (
            <Text style={styles.statusTip}>支付成功，您的门票已生成</Text>
          )}
        </View>

        {/* 订单流程 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单流程</Text>
          <View style={styles.card}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, order.status !== 'pending' && styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>订单创建</Text>
                <Text style={styles.timelineTime}>
                  {formatDateTime(new Date(Number(order.createdAt)))}
                </Text>
              </View>
            </View>

            {order.status !== 'cancelled' && (
              <>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, order.paidAt && styles.timelineDotActive]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>支付完成</Text>
                    {order.paidAt && (
                      <Text style={styles.timelineTime}>
                        {formatDateTime(new Date(Number(order.paidAt)))}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}

            {order.status === 'cancelled' && (
              <>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>订单取消</Text>
                  </View>
                </View>
              </>
            )}

            {order.status === 'refunded' && (
              <>
                <View style={styles.timelineLine} />
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>订单退款</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 订单信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订单号</Text>
              <Text style={styles.infoValue}>{order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>活动ID</Text>
              <Text style={styles.infoValue}>{order.eventId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>票档ID</Text>
              <Text style={styles.infoValue}>{order.tierId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>购买数量</Text>
              <Text style={styles.infoValue}>{order.qty} 张</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订单金额</Text>
              <Text style={[styles.infoValue, styles.priceText]}>
                {formatPrice(totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* 占位，防止底部被遮挡 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomBar}>
        {order.status === 'pending' && (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancel}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>取消订单</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePay}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>去支付</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === 'paid' && (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRefund}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>申请退款</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewTickets}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>查看门票</Text>
            </TouchableOpacity>
          </>
        )}

        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statusCard: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusIcon: {
    fontSize: fontSize.xl,
  },
  statusLabel: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  statusTip: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  timelineLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timelineTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  priceText: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: 'bold',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
