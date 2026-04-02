import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, GRADIENTS } from '../constants/config';
import { useCountdown } from '../hooks/useCountdown';
import type { Event } from '../services/events';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

function CountdownLabel({ startTime }: { startTime: string }) {
  const { label, isUpcoming, isUrgent } = useCountdown(startTime);
  if (!isUpcoming) return null;
  return (
    <View style={[styles.countdownBadge, isUrgent && styles.countdownUrgent]}>
      <Ionicons name="time-outline" size={12} color={isUrgent ? COLORS.priceCTA : COLORS.primary} />
      <Text style={[styles.countdownText, isUrgent && styles.countdownTextUrgent]}>{label}</Text>
    </View>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  concert: '演唱会',
  festival: '音乐节',
  exhibition: '展览',
  musicale: '音乐会',
  show: '演出',
  sports: '体育赛事',
  other: '其他',
};

export default function EventCard({ event, onPress }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始';
      case 'ongoing': return '进行中';
      case 'ended': return '已结束';
      default: return '';
    }
  };

  const minPrice = event.minPrice ?? null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return COLORS.primary;
      case 'ongoing': return COLORS.success;
      case 'ended': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {event.coverImage ? (
          <Image source={{ uri: event.coverImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
          </View>
        )}
        <LinearGradient
          colors={GRADIENTS.imageOverlay as [string, string]}
          style={styles.imageOverlay}
        />
        {/* 状态标签 */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
          <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.name}</Text>

        {/* 倒计时 */}
        {event.status === 'upcoming' && (
          <CountdownLabel startTime={event.startTime} />
        )}

        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>{event.venue}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoText}>{formatDate(event.startTime)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {minPrice !== null && (
            <Text style={styles.priceText}>¥{minPrice}<Text style={styles.priceUnit}>起</Text></Text>
          )}
          {event.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{CATEGORY_LABELS[event.category] || event.category}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}12`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  countdownUrgent: {
    backgroundColor: `${COLORS.priceCTA}15`,
  },
  countdownText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  countdownTextUrgent: {
    color: COLORS.priceCTA,
  },
  info: {
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoIcon: {
    marginRight: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.priceCTA,
  },
  priceUnit: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
