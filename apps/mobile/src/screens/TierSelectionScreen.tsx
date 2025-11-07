import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { TierCard } from '../components/TierCard';
import { ErrorState } from '../components/ErrorState';
import { formatPrice } from '../utils/format';
import { getEventDetail, type EventDetail, type Tier } from '../services/events';

interface TierQuantity {
  tierId: number;
  quantity: number;
}

export default function TierSelectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params as { eventId: number };

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tierQuantities, setTierQuantities] = useState<Map<number, number>>(new Map());

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

  const handleQuantityChange = (tierId: number, quantity: number) => {
    setTierQuantities((prev) => {
      const newMap = new Map(prev);
      if (quantity === 0) {
        newMap.delete(tierId);
      } else {
        newMap.set(tierId, quantity);
      }
      return newMap;
    });
  };

  // 计算总价和总数量
  const calculateTotal = () => {
    if (!event) return { totalQuantity: 0, totalPrice: 0 };

    let totalQuantity = 0;
    let totalPrice = 0;

    tierQuantities.forEach((quantity, tierId) => {
      const tier = event.tiers.find((t) => t.id === tierId);
      if (tier) {
        totalQuantity += quantity;
        totalPrice += tier.price * quantity;
      }
    });

    return { totalQuantity, totalPrice };
  };

  const handleProceedToCheckout = () => {
    const { totalQuantity } = calculateTotal();

    if (totalQuantity === 0) {
      Alert.alert('提示', '请至少选择一张票');
      return;
    }

    // 构建选票信息
    const selectedTiers = Array.from(tierQuantities.entries()).map(([tierId, quantity]) => {
      const tier = event?.tiers.find((t) => t.id === tierId);
      return {
        tierId,
        tierName: tier?.name || '',
        price: tier?.price || 0,
        quantity,
      };
    });

    // 跳转到下单确认页面
    navigation.navigate('Checkout' as never, {
      eventId,
      selectedTiers,
    } as never);
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
      {/* 活动信息头部 */}
      <View style={styles.header}>
        <Text style={styles.eventName} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.eventMeta}>
          {event.city} · {event.venue}
        </Text>
        <Text style={styles.eventDate}>
          {event.date} {event.time}
        </Text>
      </View>

      {/* 票档列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>选择票档</Text>
          <Text style={styles.sectionSubtitle}>请选择您需要的票档和数量</Text>
        </View>

        {event.tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            quantity={tierQuantities.get(tier.id) || 0}
            onQuantityChange={(quantity) => handleQuantityChange(tier.id, quantity)}
          />
        ))}

        {/* 占位，防止底部被遮挡 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部操作栏 */}
      {totalQuantity > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalSection}>
            <View>
              <Text style={styles.totalLabel}>
                共 {totalQuantity} 张
              </Text>
              <View style={styles.totalPriceRow}>
                <Text style={styles.totalPriceLabel}>合计：</Text>
                <Text style={styles.totalPrice}>
                  {formatPrice(totalPrice)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleProceedToCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>去下单</Text>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalPriceLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    marginRight: spacing.xs,
  },
  totalPrice: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  checkoutButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
