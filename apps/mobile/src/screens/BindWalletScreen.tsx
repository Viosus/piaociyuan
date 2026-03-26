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
      if (result.ok && result.data) {
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
    // 简单的地址验证（0x 开头，42 个字符）
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleBindWallet = async () => {
    if (!walletAddress.trim()) {
      Alert.alert('提示', '请输入钱包地址');
      return;
    }

    if (!validateWalletAddress(walletAddress)) {
      Alert.alert('提示', '请输入有效的地址');
      return;
    }

    // 注意：实际的绑定需要验证
    // 这里简化为直接输入地址（仅供演示）
    Alert.alert(
      '提示',
      '当前版本暂不支持在移动端直接绑定，请在 Web 端完成操作。',
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
            <Text style={styles.successTitle}>已绑定</Text>
            <Text style={styles.successDescription}>
              您的账户已成功绑定
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>绑定信息</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>地址</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {walletStatus.walletAddress.substring(0, 10)}...
                  {walletStatus.walletAddress.substring(
                    walletStatus.walletAddress.length - 8
                  )}
                </Text>
              </View>

              {walletStatus.walletProvider && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>类型</Text>
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

          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            <Text style={styles.tipText}>
              绑定后暂不支持更换。如需更换，请联系客服。
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
          <Text style={styles.title}>账户绑定</Text>
          <Text style={styles.description}>
            绑定后即可领取专属数字藏品
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>地址</Text>
          <Input
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="请输入地址 (0x...)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            请输入以 0x 开头的 42 位地址
          </Text>
        </View>

        <View style={styles.guidSection}>
          <Text style={styles.sectionTitle}>需要帮助？</Text>

          <TouchableOpacity style={styles.guideItem} onPress={handleOpenGuide}>
            <View style={styles.guideIconContainer}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.guideContent}>
              <Text style={styles.guideTitle}>查看帮助教程</Text>
              <Text style={styles.guideDescription}>
                了解如何完成账户绑定
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button
            title={submitting ? '绑定中...' : '确认绑定'}
            onPress={handleBindWallet}
            disabled={submitting}
          />
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.tipText}>
            您的信息安全受到保护。绑定仅用于数字藏品领取和所有权验证。
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
