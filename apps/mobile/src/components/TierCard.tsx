import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/config';
import { QuantitySelector } from './QuantitySelector';
import { formatPrice } from '../utils/format';

interface Tier {
  id: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
}

interface TierCardProps {
  tier: Tier;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

export const TierCard: React.FC<TierCardProps> = ({
  tier,
  quantity,
  onQuantityChange,
  disabled = false,
}) => {
  const isSoldOut = tier.remaining === 0;
  const maxQuantity = Math.min(10, tier.remaining);
  const stockPercentage = (tier.remaining / tier.capacity) * 100;

  // 库存状态
  const getStockStatus = () => {
    if (isSoldOut) {
      return { text: '已售罄', color: colors.error };
    }
    if (stockPercentage <= 10) {
      return { text: `仅剩 ${tier.remaining} 张`, color: colors.warning };
    }
    if (stockPercentage <= 30) {
      return { text: `剩余 ${tier.remaining} 张`, color: colors.warning };
    }
    return { text: `剩余 ${tier.remaining} 张`, color: colors.success };
  };

  const stockStatus = getStockStatus();

  return (
    <View style={[styles.container, (isSoldOut || disabled) && styles.containerDisabled]}>
      {/* 票档信息 */}
      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Text style={styles.tierName}>{tier.name}</Text>
          {isSoldOut && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>售罄</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceSymbol}>¥</Text>
          <Text style={styles.priceValue}>{tier.price}</Text>
          <Text style={styles.priceUnit}>/张</Text>
        </View>

        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
          <Text style={[styles.stockText, { color: stockStatus.color }]}>
            {stockStatus.text}
          </Text>
        </View>
      </View>

      {/* 数量选择器 */}
      <View style={styles.selectorSection}>
        {!isSoldOut && !disabled && (
          <QuantitySelector
            value={quantity}
            min={0}
            max={maxQuantity}
            onChange={onQuantityChange}
          />
        )}
      </View>

      {/* 小计 */}
      {quantity > 0 && (
        <View style={styles.subtotalSection}>
          <Text style={styles.subtotalLabel}>小计：</Text>
          <Text style={styles.subtotalValue}>
            {formatPrice(tier.price * quantity)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  infoSection: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  soldOutBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldOutText: {
    fontSize: fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  priceSymbol: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: 'bold',
  },
  priceValue: {
    fontSize: fontSize.xxxl,
    color: colors.primary,
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  selectorSection: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  subtotalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subtotalLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  subtotalValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
