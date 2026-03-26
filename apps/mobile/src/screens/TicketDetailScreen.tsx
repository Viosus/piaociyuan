import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { colors, spacing, fontSize } from '../constants/config';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/date';
import { getTicketDetail, refundTicket, type Ticket } from '../services/tickets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 票状态配置
const TICKET_STATUS_CONFIG = {
  available: { label: '未使用', color: colors.success, icon: '✓' },
  sold: { label: '未使用', color: colors.success, icon: '✓' },
  used: { label: '已使用', color: colors.textSecondary, icon: '✓' },
  refunded: { label: '已退票', color: colors.error, icon: '↩' },
};

export default function TicketDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { ticketId } = route.params as { ticketId: string };

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadTicketDetail();
  }, [ticketId]);

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTicketDetail(ticketId);
      if (response.ok && response.data) {
        setTicket(response.data);
      } else {
        setError(response.error || '加载门票详情失败');
      }
    } catch (error: any) {
      setError(error.message || '加载门票详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = () => {
    if (!ticket) return;

    if (ticket.status === 'used') {
      Alert.alert('无法退票', '门票已使用，无法退票');
      return;
    }

    if (ticket.status === 'refunded') {
      Alert.alert('无法退票', '门票已退票');
      return;
    }

    Alert.alert('退票确认', '确定要退这张门票吗？退票后将无法恢复。', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确定退票',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            const response = await refundTicket(ticketId);
            if (response.ok) {
              Alert.alert('成功', '退票成功');
              loadTicketDetail();
            } else {
              Alert.alert('失败', response.error || '退票失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '退票失败');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleViewLargeQR = () => {
    setShowQRModal(true);
  };

  const handleShare = async () => {
    if (!ticket) return;

    try {
      const shareMessage = `【票次元门票】
活动：${ticket.event?.name || '未知活动'}
票档：${ticket.tier?.name || '未知票档'}
票码：${ticket.ticketCode}
价格：¥${ticket.price}
状态：${statusConfig.label}

请妥善保管您的门票信息！`;

      const result = await Share.share({
        message: shareMessage,
        title: '分享门票',
      });

      if (result.action === Share.sharedAction) {
        // 分享成功
      }
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
        <ErrorState message={error} onRetry={loadTicketDetail} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState message="门票不存在" onRetry={loadTicketDetail} />
      </SafeAreaView>
    );
  }

  const statusConfig = TICKET_STATUS_CONFIG[ticket.status as keyof typeof TICKET_STATUS_CONFIG] || {
    label: ticket.status,
    color: colors.textSecondary,
    icon: '?',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 票状态 */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusConfig.color}15` }]}>
          <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* 二维码 */}
        <View style={styles.qrSection}>
          <TouchableOpacity
            style={styles.qrContainer}
            onPress={handleViewLargeQR}
            activeOpacity={0.8}
          >
            <QRCode
              value={ticket.ticketCode}
              size={200}
              backgroundColor={colors.surface}
            />
          </TouchableOpacity>
          <Text style={styles.qrHint}>点击二维码可放大查看</Text>
          <Text style={styles.ticketCode}>票码：{ticket.ticketCode}</Text>

          {/* 分享按钮 */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonIcon}>📤</Text>
            <Text style={styles.shareButtonText}>分享门票</Text>
          </TouchableOpacity>
        </View>

        {/* 门票信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>门票信息</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>票ID</Text>
              <Text style={styles.infoValue}>{ticket.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>活动ID</Text>
              <Text style={styles.infoValue}>{ticket.eventId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>票档ID</Text>
              <Text style={styles.infoValue}>{ticket.tierId}</Text>
            </View>
            {ticket.seatNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>座位号</Text>
                <Text style={styles.infoValue}>{ticket.seatNumber}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>票价</Text>
              <Text style={[styles.infoValue, styles.priceText]}>
                ¥{ticket.price}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>购买时间</Text>
              <Text style={styles.infoValue}>
                {ticket.purchasedAt
                  ? formatDateTime(new Date(ticket.purchasedAt))
                  : formatDateTime(new Date(ticket.createdAt))}
              </Text>
            </View>
            {ticket.usedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>使用时间</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(new Date(ticket.usedAt))}
                </Text>
              </View>
            )}
            {ticket.refundedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>退票时间</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(new Date(ticket.refundedAt))}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 使用须知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用须知</Text>
          <View style={styles.card}>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                请在活动开始前30分钟到达现场，出示此二维码进行验票
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                每张门票仅可使用一次，验票后即失效
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                请妥善保管门票二维码，勿泄露给他人
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                如需退票，请在活动开始前24小时申请
              </Text>
            </View>
          </View>
        </View>

        {/* 占位，防止底部被遮挡 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 底部操作按钮 */}
      {ticket.status !== 'used' && ticket.status !== 'refunded' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => (navigation as any).navigate('TransferTicket', { ticketId: ticket.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.transferButtonText}>🎁 转让/赠送</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.refundButton, actionLoading && styles.refundButtonDisabled]}
            onPress={handleRefund}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.refundButtonText}>申请退票</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 二维码放大弹窗 */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQRModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalQRContainer}>
              <QRCode
                value={ticket.ticketCode}
                size={SCREEN_WIDTH * 0.7}
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.modalTicketCode}>{ticket.ticketCode}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.modalCloseText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  statusIcon: {
    fontSize: fontSize.xl,
  },
  statusLabel: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  qrHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ticketCode: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  shareButtonIcon: {
    fontSize: fontSize.lg,
  },
  shareButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827', // 深色文字在黄色背景上更易读
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  priceText: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: 'bold',
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  noticeBullet: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    gap: spacing.md,
  },
  transferButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  transferButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#111827',
  },
  refundButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  refundButtonDisabled: {
    opacity: 0.6,
  },
  refundButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalQRContainer: {
    padding: spacing.xl,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  modalTicketCode: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  modalCloseButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  modalCloseText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
});
