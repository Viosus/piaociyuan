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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/date';
import { getTransferByCode, acceptTransfer, type TicketTransfer } from '../services/tickets';

// 转让状态配置
const TRANSFER_STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  pending: { label: '待接收', color: colors.warning, desc: '等待接收' },
  accepted: { label: '已接收', color: colors.success, desc: '转让完成' },
  rejected: { label: '已拒绝', color: colors.error, desc: '转让被拒绝' },
  expired: { label: '已过期', color: colors.textSecondary, desc: '转让已过期' },
  cancelled: { label: '已取消', color: colors.textSecondary, desc: '转让已取消' },
};

export default function ReceiveTransferScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { code: initialCode } = (route.params as { code?: string }) || {};

  const [inputCode, setInputCode] = useState(initialCode || '');
  const [transfer, setTransfer] = useState<TicketTransfer | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleSearch();
    }
  }, [initialCode]);

  const handleSearch = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('提示', '请输入转让码');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTransfer(null);

      const response = await getTransferByCode(code);
      if (response.ok && response.data) {
        setTransfer(response.data);
      } else {
        setError(response.error || '转让码无效');
      }
    } catch (error: any) {
      setError(error.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!transfer) return;

    const confirmMessage = `确定要接收这张门票吗？\n\n活动：${transfer.event?.name || '活动'}`;

    Alert.alert(
      '确认接收',
      confirmMessage,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认接收',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await acceptTransfer(transfer.transferCode, 'accept');
              if (response.ok) {
                setSuccess(true);
                Alert.alert('成功', '门票接收成功！', [
                  {
                    text: '查看我的门票',
                    onPress: () => navigation.navigate('Tickets'),
                  },
                ]);
              } else {
                Alert.alert('失败', response.error || '接收失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '接收失败');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!transfer) return;

    Alert.alert(
      '确认拒绝',
      '确定要拒绝这张门票吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认拒绝',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await acceptTransfer(transfer.transferCode, 'reject');
              if (response.ok) {
                Alert.alert('已拒绝', '你已拒绝该转让', [
                  { text: '确定', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('失败', response.error || '操作失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '操作失败');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const statusConfig = transfer
    ? TRANSFER_STATUS_CONFIG[transfer.status] || TRANSFER_STATUS_CONFIG.pending
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 输入转让码 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>输入转让码</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.codeInput}
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="请输入8位转让码"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={8}
            />
            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={styles.searchButtonText}>查询</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 错误状态 */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 转让详情 */}
        {transfer && (
          <View style={styles.transferCard}>
            {/* 状态 */}
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig?.color}20` }]}>
              <Text style={[styles.statusText, { color: statusConfig?.color }]}>
                {statusConfig?.label}
              </Text>
            </View>

            {/* 活动信息 */}
            <View style={styles.eventSection}>
              {(transfer.event?.coverImage || transfer.event?.cover) && (
                <Image
                  source={{ uri: transfer.event.coverImage || transfer.event.cover }}
                  style={styles.eventCover}
                  contentFit="cover"
                />
              )}
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{transfer.event?.name || '活动'}</Text>
                <Text style={styles.eventDetail}>
                  📅 {transfer.event?.date || '-'}
                </Text>
                <Text style={styles.eventDetail}>
                  📍 {transfer.event?.venue || '-'}
                </Text>
              </View>
            </View>

            {/* 门票信息 */}
            <View style={styles.ticketSection}>
              <Text style={styles.sectionLabel}>门票信息</Text>
              <View style={styles.ticketInfoRow}>
                <Text style={styles.ticketLabel}>票档</Text>
                <Text style={styles.ticketValue}>{transfer.tier?.name || '-'}</Text>
              </View>
              <View style={styles.ticketInfoRow}>
                <Text style={styles.ticketLabel}>票价</Text>
                <Text style={styles.ticketPrice}>¥{transfer.ticket?.price || 0}</Text>
              </View>
              {transfer.ticket?.seatNumber && (
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketLabel}>座位</Text>
                  <Text style={styles.ticketValue}>{transfer.ticket.seatNumber}</Text>
                </View>
              )}
            </View>

            {/* 转让人信息 */}
            <View style={styles.fromUserSection}>
              <Text style={styles.sectionLabel}>转让人</Text>
              <View style={styles.userRow}>
                <Image
                  source={transfer.fromUser?.avatar || 'https://via.placeholder.com/40'}
                  style={styles.userAvatar}
                  contentFit="cover"
                />
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>
                      {transfer.fromUser?.nickname || '用户'}
                    </Text>
                    {transfer.fromUser?.isVerified && (
                      <Text style={styles.verifiedBadge}>✓</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* 留言 */}
            {transfer.message && (
              <View style={styles.messageSection}>
                <Text style={styles.sectionLabel}>留言</Text>
                <Text style={styles.messageText}>"{transfer.message}"</Text>
              </View>
            )}

            {/* 转让类型和价格 */}
            {transfer.transferType === 'sale' && transfer.price && (
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>转让价格</Text>
                <Text style={styles.transferPrice}>¥{transfer.price}</Text>
              </View>
            )}

            {/* 有效期 */}
            <View style={styles.expireSection}>
              <Text style={styles.expireLabel}>有效期至</Text>
              <Text style={styles.expireTime}>
                {formatDateTime(new Date(transfer.expiresAt))}
              </Text>
            </View>
          </View>
        )}

        {/* 成功状态 */}
        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successText}>门票接收成功！</Text>
            <TouchableOpacity
              style={styles.viewTicketButton}
              onPress={() => navigation.navigate('Tickets')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewTicketButtonText}>查看我的门票</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部操作按钮 */}
      {transfer && transfer.status === 'pending' && !success && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleReject}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectButtonText}>拒绝</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, actionLoading && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text style={styles.acceptButtonText}>
                {transfer.transferType === 'gift' ? '接收赠送' : '确认转让'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  // 输入区域
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
  // 错误
  errorBox: {
    backgroundColor: `${colors.error}15`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
  },
  // 转让卡片
  transferCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // 活动信息
  eventSection: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  eventCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  // 门票信息
  ticketSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  ticketLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  ticketValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  ticketPrice: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  // 转让人
  fromUserSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  verifiedBadge: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  // 留言
  messageSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  // 价格
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  priceLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  transferPrice: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  // 有效期
  expireSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expireLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  expireTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // 成功状态
  successBox: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.lg,
  },
  viewTicketButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
  },
  viewTicketButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
  // 底部按钮
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
});
