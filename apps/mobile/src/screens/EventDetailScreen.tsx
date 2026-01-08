import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { getEventDetail, type EventDetail, type Tier } from '../services/events';
import Button from '../components/Button';

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
    } catch (err: any) {
      Alert.alert('错误', err.message || '加载活动详情失败');
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

    if (selectedTier.available <= 0) {
      Alert.alert('抱歉', '该票档已售罄');
      return;
    }

    // 导航到购票页面
    navigation.navigate('Checkout' as never, {
      eventId: eventId,
      selectedTiers: [
        {
          tierId: selectedTier.id,
          tierName: selectedTier.name,
          price: selectedTier.price,
          quantity: 1,
        },
      ],
    } as never);
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
        <Text style={styles.errorText}>活动不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {event.coverImage ? (
          <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.placeholderIcon}>🎭</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{event.name}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{event.venue}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View>
                <Text style={styles.infoText}>开始：{formatDate(event.startTime)}</Text>
                <Text style={styles.infoText}>结束：{formatDate(event.endTime)}</Text>
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
            {event.tiers.map((tier) => (
              <View
                key={tier.id}
                style={[
                  styles.tierCard,
                  selectedTier?.id === tier.id && styles.tierCardSelected,
                ]}
                onTouchEnd={() => setSelectedTier(tier)}
              >
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>¥{tier.price}</Text>
                </View>
                {tier.description && (
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                )}
                <View style={styles.tierFooter}>
                  <Text style={styles.tierAvailable}>
                    剩余：{tier.available}/{tier.capacity}
                  </Text>
                  {tier.available <= 0 && (
                    <Text style={styles.soldOutBadge}>售罄</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>价格</Text>
          <Text style={styles.priceValue}>
            ¥{selectedTier?.price || 0}
          </Text>
        </View>
        <Button
          title="立即购票"
          onPress={handleBuyTicket}
          disabled={!selectedTier || selectedTier.available <= 0}
          style={styles.buyButton}
        />
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
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.surface,
  },
  coverPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoSection: {
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  infoIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierCardSelected: {
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
  },
  tierDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  tierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierAvailable: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  soldOutBadge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  buyButton: {
    flex: 1,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
  },
});
