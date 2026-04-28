import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import type { Order } from '../services/orders';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  /** 待支付订单可选回调（仅在 status === 'pending' 时显示） */
  onPay?: () => void;
  /** 取消订单可选回调 */
  onCancel?: () => void;
  /** 退款可选回调 */
  onRefund?: () => void;
}

// 注意：onPay/onCancel/onRefund 当前仅作类型暴露给 OrdersScreen 调用，UI 内未渲染按钮——
// 后续若要在卡片上加快捷操作按钮再补 JSX
export default function OrderCard({ order, onPress }: OrderCardProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待支付';
      case 'paid':
        return '已支付';
      case 'cancelled':
        return '已取消';
      case 'refunded':
        return '已退款';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'paid':
        return COLORS.success;
      case 'cancelled':
      case 'refunded':
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.orderId}>订单号: {order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      {order.event && (
        <View style={styles.eventInfo}>
          {order.event.coverImage ? (
            <Image source={{ uri: order.event.coverImage }} style={styles.eventImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>🎭</Text>
            </View>
          )}
          <View style={styles.eventDetails}>
            <Text style={styles.eventName} numberOfLines={2}>
              {order.event.name}
            </Text>
            <Text style={styles.eventVenue}>📍 {order.event.venue}</Text>
            <Text style={styles.eventTime}>
              🕐 {formatDate(order.event.startTime)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.orderInfo}>
          <Text style={styles.tierName}>{order.tier?.name}</Text>
          <Text style={styles.quantity}>x {order.qty}</Text>
        </View>
        <Text style={styles.totalPrice}>¥{order.totalPrice}</Text>
      </View>

      <Text style={styles.orderDate}>下单时间: {formatDate(order.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orderId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  eventInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  eventName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  eventVenue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  eventTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  quantity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  totalPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  orderDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
