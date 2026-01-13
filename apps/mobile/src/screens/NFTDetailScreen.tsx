import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingOverlay } from '../components/LoadingOverlay';
import Button from '../components/Button';
import NFTMediaDisplay from '../components/NFTMediaDisplay';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import { getNFTDetail, type UserNFT, type NFTRarity } from '../services/nft';

type NFTDetailRouteParams = {
  nftId: number;
};

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

// 类别配置
const CATEGORY_CONFIG = {
  badge: { label: '徽章', icon: 'medal' as const },
  ticket_stub: { label: '票根', icon: 'ticket' as const },
  poster: { label: '海报', icon: 'image' as const },
  certificate: { label: '证书', icon: 'ribbon' as const },
  art: { label: '艺术品', icon: 'color-palette' as const },
};

export default function NFTDetailScreen() {
  const route = useRoute<RouteProp<{ params: NFTDetailRouteParams }, 'params'>>();
  const { nftId } = route.params;

  const [nft, setNft] = useState<UserNFT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNFTDetail();
  }, [nftId]);

  const loadNFTDetail = async () => {
    try {
      const result = await getNFTDetail(nftId);
      if (result.success && result.data) {
        setNft(result.data);
      } else {
        Alert.alert('错误', result.error || '加载 NFT 详情失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载 NFT 详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('错误', '无法打开链接');
    });
  };

  const handleShare = async () => {
    if (!nft) return;

    try {
      await Share.share({
        message: `查看我的 NFT 数字藏品：${nft.nft.name}\n\n${nft.nft.description}`,
      });
    } catch {
      // 静默处理分享失败
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!nft) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>NFT 不存在</Text>
      </View>
    );
  }

  const rarityConfig = RARITY_CONFIG[nft.nft.rarity];
  const categoryConfig = CATEGORY_CONFIG[nft.nft.category];

  return (
    <ScrollView style={styles.container}>
      {/* NFT 图片/3D 模型 */}
      <View style={styles.imageContainer}>
        <NFTMediaDisplay
          has3DModel={nft.nft.has3DModel}
          model3DUrl={nft.nft.model3DUrl}
          imageUrl={nft.nft.imageUrl}
          name={nft.nft.name}
          style={styles.mediaDisplay}
        />

        {/* 特殊标记（AR/动画，3D 标记由 NFTMediaDisplay 内部处理） */}
        <View style={styles.featureBadges}>
          {nft.nft.hasAR && (
            <View style={styles.featureBadge}>
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={styles.featureBadgeText}>AR</Text>
            </View>
          )}
          {nft.nft.hasAnimation && (
            <View style={styles.featureBadge}>
              <Ionicons name="videocam-outline" size={20} color="#fff" />
              <Text style={styles.featureBadgeText}>动画</Text>
            </View>
          )}
        </View>

        {/* 分享按钮 */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{nft.nft.name}</Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: rarityConfig.bgColor },
              ]}
            >
              <Text style={[styles.rarityText, { color: rarityConfig.color }]}>
                {rarityConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.categoryRow}>
            <Ionicons
              name={categoryConfig.icon}
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.categoryText}>{categoryConfig.label}</Text>
          </View>

          <Text style={styles.description}>{nft.nft.description}</Text>
        </View>

        {/* 供应信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>供应信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>总供应量</Text>
            <Text style={styles.infoValue}>{nft.nft.totalSupply}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>已铸造</Text>
            <Text style={styles.infoValue}>{nft.nft.mintedCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>稀有度</Text>
            <Text style={[styles.infoValue, { color: rarityConfig.color }]}>
              {((nft.nft.mintedCount / nft.nft.totalSupply) * 100).toFixed(1)}% 铸造
            </Text>
          </View>
        </View>

        {/* 所有权信息 */}
        {nft.isOnChain && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>区块链信息</Text>
            {nft.contractAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>合约地址</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {nft.contractAddress.substring(0, 10)}...
                  {nft.contractAddress.substring(nft.contractAddress.length - 8)}
                </Text>
              </View>
            )}
            {nft.tokenId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Token ID</Text>
                <Text style={styles.infoValue}>#{nft.tokenId}</Text>
              </View>
            )}
            {nft.ownerWalletAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>所有者</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {nft.ownerWalletAddress.substring(0, 10)}...
                  {nft.ownerWalletAddress.substring(nft.ownerWalletAddress.length - 8)}
                </Text>
              </View>
            )}
            {nft.mintedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>铸造时间</Text>
                <Text style={styles.infoValue}>
                  {new Date(nft.mintedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 获得方式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>获得信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>获得方式</Text>
            <Text style={styles.infoValue}>
              {nft.sourceType === 'ticket_purchase'
                ? '购票获得'
                : nft.sourceType === 'direct_purchase'
                ? '直接购买'
                : nft.sourceType === 'airdrop'
                ? '空投'
                : '转账'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>获得时间</Text>
            <Text style={styles.infoValue}>
              {new Date(nft.obtainedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* 铸造状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>铸造状态</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={
                  nft.mintStatus === 'minted'
                    ? 'checkmark-circle'
                    : nft.mintStatus === 'minting'
                    ? 'sync'
                    : nft.mintStatus === 'failed'
                    ? 'close-circle'
                    : 'time'
                }
                size={24}
                color={
                  nft.mintStatus === 'minted'
                    ? COLORS.success
                    : nft.mintStatus === 'minting'
                    ? COLORS.primary
                    : nft.mintStatus === 'failed'
                    ? COLORS.error
                    : COLORS.warning
                }
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusText}>
                  {nft.mintStatus === 'minted'
                    ? '已铸造'
                    : nft.mintStatus === 'minting'
                    ? '铸造中'
                    : nft.mintStatus === 'failed'
                    ? '铸造失败'
                    : '待铸造'}
                </Text>
                {nft.isOnChain && (
                  <Text style={styles.statusSubText}>已上链</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 操作按钮 */}
        {nft.isOnChain && nft.contractAddress && nft.tokenId && (
          <View style={styles.actions}>
            <Button
              title="在 OpenSea 查看"
              onPress={() =>
                handleOpenLink(
                  `https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`
                )
              }
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="查看区块链浏览器"
              onPress={() =>
                handleOpenLink(
                  `https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`
                )
              }
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  mediaDisplay: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featureBadges: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    marginLeft: SPACING.sm,
  },
  featureBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: '#fff',
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  shareButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
  },
  rarityText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: SPACING.md,
  },
  statusText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusSubText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actions: {
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
