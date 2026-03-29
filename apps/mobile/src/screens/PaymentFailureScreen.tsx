import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';

export default function PaymentFailureScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, reason } = route.params as { orderId: string; reason?: string };

  const handleRetry = () => {
    navigation.replace('Payment' as never, { orderId } as never);
  };

  const handleBackHome = () => {
    navigation.navigate('Home' as never);
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 失败图标 */}
        <View style={styles.iconContainer}>
          <View style={styles.failureIcon}>
            <Text style={styles.iconText}>✕</Text>
          </View>
        </View>

        {/* 失败标题 */}
        <Text style={styles.title}>支付失败</Text>
        <Text style={styles.subtitle}>
          {reason || '很抱歉，支付未完成'}
        </Text>

        {/* 常见原因 */}
        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>可能的原因：</Text>
          <View style={styles.reasonItem}>
            <Text style={styles.reasonBullet}>•</Text>
            <Text style={styles.reasonText}>网络连接不稳定</Text>
          </View>
          <View style={styles.reasonItem}>
            <Text style={styles.reasonBullet}>•</Text>
            <Text style={styles.reasonText}>账户余额不足</Text>
          </View>
          <View style={styles.reasonItem}>
            <Text style={styles.reasonBullet}>•</Text>
            <Text style={styles.reasonText}>支付超时</Text>
          </View>
          <View style={styles.reasonItem}>
            <Text style={styles.reasonBullet}>•</Text>
            <Text style={styles.reasonText}>取消了支付</Text>
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            订单仍然有效，您可以稍后继续支付
          </Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>重新支付</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewOrders}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>查看我的订单</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={handleBackHome}
        >
          <Text style={styles.textButtonText}>返回首页</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  failureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 48,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  reasonBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reasonTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  reasonBullet: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipIcon: {
    fontSize: fontSize.lg,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  buttonSection: {
    padding: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  textButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
