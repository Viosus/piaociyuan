import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Share,
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/date';
import { getNFTDetail, createNFTTransfer, type UserNFT } from '../services/nft';

// 转让类型选项
const TRANSFER_TYPES = [
  { value: 'gift', label: '赠送', desc: '免费赠送给朋友' },
  { value: 'sale', label: '出售', desc: '设置价格转让' },
];

// 稀有度颜色
const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

// 稀有度标签
const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export default function TransferNFTScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userNftId } = route.params as { userNftId: string };

  const [userNft, setUserNft] = useState<UserNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [transferType, setTransferType] = useState<'gift' | 'sale'>('gift');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(48);

  // 转让结果
  const [transferResult, setTransferResult] = useState<{
    transferCode: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    loadNFTDetail();
  }, [userNftId]);

  const loadNFTDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNFTDetail(userNftId);
      if (response.ok && response.data) {
        setUserNft(response.data);
        // 检查是否可以转让
        if (response.data.mintStatus !== 'minted') {
          setError('该藏品尚未生成完成，无法转让');
        }
      } else {
        setError(response.error || '加载藏品详情失败');
      }
    } catch (error: any) {
      setError(error.message || '加载藏品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (transferType === 'sale' && (!price || parseInt(price) <= 0)) {
      Alert.alert('提示', '请输入有效的出售价格');
      return;
    }

    Alert.alert(
      transferType === 'gift' ? '确认赠送' : '确认出售',
      `确定要${transferType === 'gift' ? '赠送' : '出售'}这个次元收藏品吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await createNFTTransfer({
                userNftId,
                transferType,
                price: transferType === 'sale' ? parseInt(price) : undefined,
                message: message.trim() || undefined,
                expiresInHours,
              });

              if (response.ok && response.data) {
                setTransferResult({
                  transferCode: response.data.transferCode,
                  expiresAt: response.data.expiresAt,
                });
              } else {
                Alert.alert('失败', response.error || '发起转让失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '发起转让失败');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = () => {
    if (transferResult?.transferCode) {
      Clipboard.setString(transferResult.transferCode);
      Alert.alert('已复制', '转让码已复制到剪贴板');
    }
  };

  const handleShare = async () => {
    if (!transferResult?.transferCode || !userNft) return;

    try {
      const shareMessage = `【票次元藏品转让】
我想把这个次元收藏品${transferType === 'gift' ? '赠送' : '出售'}给你！

收藏品：${userNft.nft?.name || '数字藏品'}
稀有度：${RARITY_LABELS[userNft.nft?.rarity || 'common']}
${message ? `留言：${message}\n` : ''}
转让码：${transferResult.transferCode}

打开票次元App，在「我的」中点击「接收次元收藏品」，输入转让码即可接收。

有效期至：${formatDateTime(new Date(transferResult.expiresAt))}`;

      await Share.share({
        message: shareMessage,
        title: '分享藏品转让',
      });
    } catch (error: any) {
      Alert.alert('分享失败', error.message);
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
        <ErrorState message={error} onRetry={loadNFTDetail} />
      </SafeAreaView>
    );
  }

  if (!userNft) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message="藏品不存在" />
      </SafeAreaView>
    );
  }

  const nft = userNft.nft;
  const rarityColor = RARITY_COLORS[nft?.rarity || 'common'];

  // 转让成功页面
  if (transferResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>
              {transferType === 'gift' ? '赠送发起成功' : '出售发起成功'}
            </Text>
            <Text style={styles.successSubtitle}>
              请将转让码分享给对方
            </Text>
          </View>

          {/* 转让码 */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>转让码</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{transferResult.transferCode}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonText}>复制转让码</Text>
            </TouchableOpacity>
          </View>

          {/* 二维码 */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>或扫描二维码</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={`piaociyuan://nft-transfer/${transferResult.transferCode}`}
                size={180}
                backgroundColor="#ffffff"
              />
            </View>
          </View>

          {/* 有效期 */}
          <View style={styles.expireInfo}>
            <Text style={styles.expireText}>
              有效期至：{formatDateTime(new Date(transferResult.expiresAt))}
            </Text>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.shareButtonText}>📤 分享给好友</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>返回</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 转让表单页面
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 藏品信息卡片 */}
        <View style={styles.nftCard}>
          {nft?.imageUrl ? (
            <Image source={{ uri: nft.imageUrl }} style={styles.nftImage} />
          ) : (
            <View style={styles.nftImagePlaceholder}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
            </View>
          )}
          <View style={styles.nftInfo}>
            <Text style={styles.nftName}>{nft?.name || '数字藏品'}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {RARITY_LABELS[nft?.rarity || 'common']}
              </Text>
            </View>
          </View>
        </View>

        {/* 转让类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择方式</Text>
          <View style={styles.typeOptions}>
            {TRANSFER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  transferType === type.value && styles.typeOptionActive,
                ]}
                onPress={() => setTransferType(type.value as 'gift' | 'sale')}
                activeOpacity={0.7}
              >
                <View style={styles.typeRadio}>
                  {transferType === type.value && (
                    <View style={styles.typeRadioInner} />
                  )}
                </View>
                <View style={styles.typeContent}>
                  <Text
                    style={[
                      styles.typeLabel,
                      transferType === type.value && styles.typeLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 出售价格（仅出售时显示） */}
        {transferType === 'sale' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>出售价格</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>¥</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="请输入价格"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {/* 留言 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>留言（可选）</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="给对方留句话..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={100}
          />
          <Text style={styles.messageCount}>{message.length}/100</Text>
        </View>

        {/* 有效期选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>有效期</Text>
          <View style={styles.expireOptions}>
            {[24, 48, 72].map((hours) => (
              <TouchableOpacity
                key={hours}
                style={[
                  styles.expireOption,
                  expiresInHours === hours && styles.expireOptionActive,
                ]}
                onPress={() => setExpiresInHours(hours)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.expireOptionText,
                    expiresInHours === hours && styles.expireOptionTextActive,
                  ]}
                >
                  {hours}小时
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 提示 */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>注意事项</Text>
          <Text style={styles.tipsItem}>• 转让发起后，藏品将暂时锁定</Text>
          <Text style={styles.tipsItem}>• 对方接收前，你可以随时取消转让</Text>
          <Text style={styles.tipsItem}>• 超过有效期未接收，转让自动取消</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Text style={styles.submitButtonText}>
              {transferType === 'gift' ? '确认赠送' : '确认出售'}
            </Text>
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
  // NFT 卡片
  nftCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  nftImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
  },
  nftImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  nftInfo: {
    padding: spacing.lg,
  },
  nftName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  rarityText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  onChainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  onChainText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
  },
  // 分区
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  // 类型选择
  typeOptions: {
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  typeLabelActive: {
    color: colors.primary,
  },
  typeDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // 价格输入
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  priceSymbol: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    paddingVertical: spacing.md,
  },
  // 留言
  messageInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  messageCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  // 有效期
  expireOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  expireOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expireOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  expireOptionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  expireOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // 提示
  tips: {
    backgroundColor: `${colors.warning}15`,
    borderRadius: 12,
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  tipsItem: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  // 底部按钮
  bottomBar: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
  // 成功页面
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  // 转让码
  codeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  codeLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  codeBox: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  copyButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  // 二维码
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    borderRadius: 12,
  },
  // 有效期
  expireInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  expireText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // 操作按钮
  actionButtons: {
    gap: spacing.md,
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
