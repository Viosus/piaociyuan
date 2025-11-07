import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import type { UserNFT, NFTRarity } from '../services/nft';

interface NFTCardProps {
  nft: UserNFT;
  onPress: () => void;
}

// 稀有度配置
const RARITY_CONFIG: Record<
  NFTRarity,
  { label: string; color: string; bgColor: string }
> = {
  common: { label: '普通', color: '#6B7280', bgColor: '#F3F4F6' },
  rare: { label: '稀有', color: '#3B82F6', bgColor: '#DBEAFE' },
  epic: { label: '史诗', color: '#8B5CF6', bgColor: '#EDE9FE' },
  legendary: { label: '传说', color: '#F59E0B', bgColor: '#FEF3C7' },
};

// 铸造状态配置
const MINT_STATUS_CONFIG = {
  pending: { label: '待铸造', color: COLORS.warning, icon: 'time-outline' as const },
  minting: { label: '铸造中', color: COLORS.primary, icon: 'sync-outline' as const },
  minted: { label: '已铸造', color: COLORS.success, icon: 'checkmark-circle-outline' as const },
  failed: { label: '铸造失败', color: COLORS.error, icon: 'close-circle-outline' as const },
};

export default function NFTCard({ nft, onPress }: NFTCardProps) {
  const rarityConfig = RARITY_CONFIG[nft.nft.rarity];
  const mintStatusConfig = MINT_STATUS_CONFIG[nft.mintStatus];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* NFT 图片 */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: nft.nft.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* 稀有度标签 */}
        <View
          style={[
            styles.rarityBadge,
            { backgroundColor: rarityConfig.bgColor },
          ]}
        >
          <Text
            style={[
              styles.rarityText,
              { color: rarityConfig.color },
            ]}
          >
            {rarityConfig.label}
          </Text>
        </View>

        {/* 特殊标记（3D/AR/动画） */}
        <View style={styles.featureBadges}>
          {nft.nft.has3DModel && (
            <View style={styles.featureBadge}>
              <Ionicons name="cube-outline" size={16} color="#fff" />
            </View>
          )}
          {nft.nft.hasAR && (
            <View style={styles.featureBadge}>
              <Ionicons name="scan-outline" size={16} color="#fff" />
            </View>
          )}
          {nft.nft.hasAnimation && (
            <View style={styles.featureBadge}>
              <Ionicons name="videocam-outline" size={16} color="#fff" />
            </View>
          )}
        </View>

        {/* 链上标记 */}
        {nft.isOnChain && (
          <View style={styles.onChainBadge}>
            <Ionicons name="link" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* NFT 信息 */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {nft.nft.name}
        </Text>

        {/* 供应信息 */}
        <View style={styles.supplyInfo}>
          <Ionicons name="copy-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.supplyText}>
            {nft.nft.mintedCount} / {nft.nft.totalSupply}
          </Text>
        </View>

        {/* 铸造状态 */}
        <View style={styles.statusContainer}>
          <Ionicons
            name={mintStatusConfig.icon}
            size={14}
            color={mintStatusConfig.color}
          />
          <Text style={[styles.statusText, { color: mintStatusConfig.color }]}>
            {mintStatusConfig.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rarityBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
  },
  rarityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  featureBadges: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
  },
  featureBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  onChainBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  supplyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  supplyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
});
