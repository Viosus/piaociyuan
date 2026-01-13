import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import { bindWallet, getWalletStatus, type WalletStatusResponse } from '../services/nft';

export default function BindWalletScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletStatusResponse | null>(null);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadWalletStatus();
  }, []);

  const loadWalletStatus = async () => {
    try {
      const result = await getWalletStatus();
      if (result.success && result.data) {
        setWalletStatus(result.data);
        if (result.data.walletAddress) {
          setWalletAddress(result.data.walletAddress);
        }
      }
    } catch {
      // 静默处理加载错误
    } finally {
      setLoading(false);
    }
  };

  const validateWalletAddress = (address: string): boolean => {
    // 简单的以太坊地址验证（0x 开头，42 个字符）
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleBindWallet = async () => {
    if (!walletAddress.trim()) {
      Alert.alert('提示', '请输入钱包地址');
      return;
    }

    if (!validateWalletAddress(walletAddress)) {
      Alert.alert('提示', '请输入有效的以太坊钱包地址');
      return;
    }

    // 注意：实际的钱包绑定需要签名验证
    // 这里简化为直接输入地址（仅供演示）
    Alert.alert(
      '提示',
      '钱包绑定需要签名验证。在移动端，建议使用 MetaMask 或其他支持 WalletConnect 的钱包应用进行连接。\n\n当前版本暂不支持直接绑定，请在 Web 端完成钱包绑定。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '访问 Web 端',
          onPress: () => {
            Linking.openURL('https://piaociyuan.com/account/wallet');
          },
        },
      ]
    );
  };

  const handleOpenGuide = () => {
    Linking.openURL('https://piaociyuan.com/help/wallet-guide');
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  // 如果已绑定钱包
  if (walletStatus?.isBound && walletStatus.walletAddress) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>钱包已绑定</Text>
            <Text style={styles.successDescription}>
              您的账户已成功绑定以太坊钱包
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>钱包信息</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>钱包地址</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {walletStatus.walletAddress.substring(0, 10)}...
                  {walletStatus.walletAddress.substring(
                    walletStatus.walletAddress.length - 8
                  )}
                </Text>
              </View>

              {walletStatus.walletProvider && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>钱包类型</Text>
                  <Text style={styles.infoValue}>{walletStatus.walletProvider}</Text>
                </View>
              )}

              {walletStatus.walletConnectedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>绑定时间</Text>
                  <Text style={styles.infoValue}>
                    {new Date(walletStatus.walletConnectedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="在区块链浏览器查看"
              onPress={() =>
                Linking.openURL(
                  `https://etherscan.io/address/${walletStatus.walletAddress}`
                )
              }
              variant="outline"
            />
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.tipText}>
              钱包绑定后暂不支持更换。如需更换钱包，请联系客服。
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // 未绑定钱包
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="wallet" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>绑定以太坊钱包</Text>
          <Text style={styles.description}>
            绑定钱包后，您的 NFT 将铸造到您的钱包地址
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>钱包地址</Text>
          <Input
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="请输入以太坊钱包地址 (0x...)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            请输入以 0x 开头的 42 位以太坊钱包地址
          </Text>
        </View>

        <View style={styles.guidSection}>
          <Text style={styles.sectionTitle}>如何获取钱包地址？</Text>

          <TouchableOpacity style={styles.guideItem} onPress={handleOpenGuide}>
            <View style={styles.guideIconContainer}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>查看钱包教程</Text>
              <Text style={styles.guideDescription}>
                了解如何创建和使用以太坊钱包
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.walletOptions}>
            <Text style={styles.walletOptionsTitle}>推荐钱包：</Text>
            <View style={styles.walletBadges}>
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>MetaMask</Text>
              </View>
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>imToken</Text>
              </View>
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>Trust Wallet</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={submitting ? '绑定中...' : '绑定钱包'}
            onPress={handleBindWallet}
            disabled={submitting}
          />
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.tipText}>
            您的钱包私钥不会被存储或上传。绑定仅用于 NFT 铸造和所有权验证。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  guidSection: {
    marginBottom: SPACING.xl,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.md,
  },
  guideIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  guideDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  walletOptions: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
  },
  walletOptionsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  walletBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  walletBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.small,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletBadgeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  actions: {
    marginBottom: SPACING.xl,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginLeft: SPACING.md,
    lineHeight: 20,
  },
  successCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.xl,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
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
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: SPACING.md,
  },
});
