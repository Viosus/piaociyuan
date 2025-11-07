import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatPrice } from '../utils/format';
import { getEventDetail, type EventDetail } from '../services/events';
import { createOrder } from '../services/orders';

interface SelectedTier {
  tierId: number;
  tierName: string;
  price: number;
  quantity: number;
}

export default function CheckoutScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, selectedTiers } = route.params as {
    eventId: number;
    selectedTiers: SelectedTier[];
  };

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 联系人信息（可选）
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEventDetail(eventId);
      if (response.ok && response.data) {
        setEvent(response.data);
      } else {
        setError(response.error || '加载活动详情失败');
      }
    } catch (err: any) {
      setError(err.message || '加载活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算总价和总数量
  const calculateTotal = () => {
    let totalQuantity = 0;
    let totalPrice = 0;

    selectedTiers.forEach((tier) => {
      totalQuantity += tier.quantity;
      totalPrice += tier.price * tier.quantity;
    });

    return { totalQuantity, totalPrice };
  };

  const handleSubmitOrder = async () => {
    const { totalPrice } = calculateTotal();

    // 这里简化处理，实际应该选择第一个票档的ID
    const firstTier = selectedTiers[0];
    if (!firstTier) {
      Alert.alert('错误', '订单信息有误');
      return;
    }

    try {
      setSubmitting(true);

      // 创建订单（使用第一个票档，后续可以支持多票档）
      const response = await createOrder({
        eventId,
        tierId: firstTier.tierId,
        qty: firstTier.quantity,
      });

      if (response.ok && response.data) {
        Alert.alert('成功', '订单创建成功', [
          {
            text: '去支付',
            onPress: () => {
              navigation.navigate('Payment' as never, {
                orderId: response.data.id,
              } as never);
            },
          },
        ]);
      } else {
        Alert.alert('失败', response.error || '创建订单失败');
      }
    } catch (err: any) {
      Alert.alert('错误', err.message || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
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
        <ErrorState message={error} onRetry={loadEventDetail} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message="活动不存在" onRetry={loadEventDetail} />
      </SafeAreaView>
    );
  }

  const { totalQuantity, totalPrice } = calculateTotal();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 活动信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>活动信息</Text>
          <View style={styles.card}>
            <Text style={styles.eventName}>{event.name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>演出时间：</Text>
              <Text style={styles.infoValue}>
                {event.date} {event.time}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>演出场馆：</Text>
              <Text style={styles.infoValue}>
                {event.city} {event.venue}
              </Text>
            </View>
          </View>
        </View>

        {/* 票档信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>票档信息</Text>
          <View style={styles.card}>
            {selectedTiers.map((tier, index) => (
              <View
                key={tier.tierId}
                style={[
                  styles.tierRow,
                  index < selectedTiers.length - 1 && styles.tierRowBorder,
                ]}
              >
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.tierName}</Text>
                  <Text style={styles.tierMeta}>
                    {formatPrice(tier.price)} × {tier.quantity}
                  </Text>
                </View>
                <Text style={styles.tierSubtotal}>
                  {formatPrice(tier.price * tier.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 联系人信息（可选） */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            联系人信息 <Text style={styles.optional}>(可选)</Text>
          </Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>姓名</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入联系人姓名"
                placeholderTextColor={colors.textSecondary}
                value={contactName}
                onChangeText={setContactName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>手机号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入联系人手机号"
                placeholderTextColor={colors.textSecondary}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* 备注 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            订单备注 <Text style={styles.optional}>(可选)</Text>
          </Text>
          <View style={styles.card}>
            <TextInput
              style={styles.textArea}
              placeholder="如有特殊需求请在此填写"
              placeholderTextColor={colors.textSecondary}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* 价格明细 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>价格明细</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>票价小计</Text>
              <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>服务费</Text>
              <Text style={styles.priceValue}>¥0</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>合计</Text>
              <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* 占位，防止底部被遮挡 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部提交按钮 */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.bottomTotalLabel}>合计：</Text>
          <Text style={styles.bottomTotalPrice}>{formatPrice(totalPrice)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>提交订单</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
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
  optional: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  eventName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tierRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tierMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tierSubtotal: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  totalSection: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  bottomTotalPrice: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
