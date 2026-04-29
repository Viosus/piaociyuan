import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, GRADIENTS } from '../constants/config';
import { getEventDetail, type EventDetail, type Tier } from '../services/events';
import { useCountdown } from '../hooks/useCountdown';
import Button from '../components/Button';

function CountdownBar({ startTime, status }: { startTime: string; status: string }) {
  const { label, isUpcoming, isUrgent } = useCountdown(startTime);

  if (status === 'ongoing') {
    return (
      <View style={[countdownStyles.bar, { backgroundColor: `${COLORS.success}15` }]}>
        <Ionicons name="radio-outline" size={16} color={COLORS.success} />
        <Text style={[countdownStyles.text, { color: COLORS.success }]}>进行中</Text>
      </View>
    );
  }
  if (status === 'ended') {
    return (
      <View style={[countdownStyles.bar, { backgroundColor: `${COLORS.textSecondary}15` }]}>
        <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textSecondary} />
        <Text style={[countdownStyles.text, { color: COLORS.textSecondary }]}>已结束</Text>
      </View>
    );
  }
  if (!isUpcoming) return null;

  return (
    <View style={[countdownStyles.bar, { backgroundColor: isUrgent ? `${COLORS.priceCTA}12` : `${COLORS.primary}12` }]}>
      <Ionicons name="time-outline" size={16} color={isUrgent ? COLORS.priceCTA : COLORS.primary} />
      <Text style={[countdownStyles.text, { color: isUrgent ? COLORS.priceCTA : COLORS.primary }]}>{label}</Text>
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params as { eventId: number };

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      const response = await getEventDetail(eventId);
      if (response.ok && response.data) {
        setEvent(response.data);
        if (response.data.tiers.length > 0) {
          setSelectedTier(response.data.tiers[0]);
        }
      } else {
        Alert.alert('错误', response.error || '加载活动详情失败');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载活动详情失败';
      Alert.alert('错误', message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBuyTicket = () => {
    if (!selectedTier) {
      Alert.alert('提示', '请选择票档');
      return;
    }

    if ((selectedTier.available ?? selectedTier.remaining ?? 0) <= 0) {
      Alert.alert('抱歉', '该票档已售罄');
      return;
    }

    navigation.navigate('Checkout', {
      eventId: eventId,
      selectedTiers: [
        {
          tierId: selectedTier.id,
          tierName: selectedTier.name,
          price: selectedTier.price,
          quantity: 1,
        },
      ],
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>活动不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 封面图 + 渐变遮罩 */}
        <View style={styles.coverContainer}>
          {event.coverImage ? (
            <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="musical-notes-outline" size={80} color={COLORS.textSecondary} />
            </View>
          )}
          <LinearGradient
            colors={GRADIENTS.imageOverlay as [string, string]}
            style={styles.coverOverlay}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.name}</Text>

          {/* 倒计时/状态 */}
          <CountdownBar startTime={event.startTime} status={event.status} />

          {/* 信息卡片 */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>{event.venue}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBg}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoText}>{formatDate(event.startTime)}</Text>
                <Text style={styles.infoTextSub}>至 {formatDate(event.endTime)}</Text>
              </View>
            </View>
          </View>

          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动简介</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>票档信息</Text>
            {event.tiers.map((tier) => {
              const isSelected = selectedTier?.id === tier.id;
              const remaining = tier.available ?? tier.remaining ?? 0;
              const isSoldOut = remaining <= 0;
              return (
                <TouchableOpacity
                  key={tier.id}
                  style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                  onPress={() => !isSoldOut && setSelectedTier(tier)}
                  activeOpacity={isSoldOut ? 1 : 0.7}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={[styles.tierPrice, isSoldOut && styles.tierPriceSoldOut]}>
                      ¥{tier.price}
                    </Text>
                  </View>
                  {tier.description && (
                    <Text style={styles.tierDescription}>{tier.description}</Text>
                  )}
                  <View style={styles.tierFooter}>
                    <View style={styles.tierStock}>
                      <View style={styles.tierStockBar}>
                        <View style={[styles.tierStockFill, {
                          width: `${Math.max(0, ((tier.capacity - remaining) / tier.capacity) * 100)}%`,
                          backgroundColor: isSoldOut ? COLORS.error : COLORS.primary,
                        }]} />
                      </View>
                      <Text style={styles.tierAvailable}>
                        {isSoldOut ? '已售罄' : `剩余 ${remaining}/${tier.capacity}`}
                      </Text>
                    </View>
                    {isSelected && !isSoldOut && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 底部购票栏 */}
      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>价格</Text>
          <Text style={styles.priceValue}>¥{selectedTier?.price || 0}</Text>
        </View>
        <TouchableOpacity
          style={[styles.buyButton, (!selectedTier || (selectedTier.available ?? selectedTier.remaining ?? 0) <= 0) && styles.buyButtonDisabled]}
          onPress={handleBuyTicket}
          disabled={!selectedTier || (selectedTier.available ?? selectedTier.remaining ?? 0) <= 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(!selectedTier || (selectedTier.available ?? selectedTier.remaining ?? 0) <= 0) ? ['#ccc', '#bbb'] as const : GRADIENTS.cta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyButtonGradient}
          >
            <Text style={styles.buyButtonText}>立即购票</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  coverContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 280,
    backgroundColor: COLORS.surface,
  },
  coverPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 52,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoTextSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  tierCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  tierCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tierName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tierPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.priceCTA,
  },
  tierPriceSoldOut: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  tierDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierStock: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  tierStockBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  tierStockFill: {
    height: '100%',
    borderRadius: 2,
  },
  tierAvailable: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.priceCTA,
  },
  buyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
});
