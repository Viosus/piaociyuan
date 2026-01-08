import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getMyTickets, type Ticket } from '../services/tickets';
import { useAuth } from '../contexts/AuthContext';

const STATUS_FILTERS = [
  { label: '全部', value: '' },
  { label: '未使用', value: 'available' },
  { label: '已使用', value: 'used' },
  { label: '已退票', value: 'refunded' },
];

const TICKET_STATUS_CONFIG = {
  available: { label: '未使用', color: colors.success },
  sold: { label: '未使用', color: colors.success },
  used: { label: '已使用', color: colors.textSecondary },
  refunded: { label: '已退票', color: colors.error },
};

export default function TicketsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [selectedStatus]);

  const loadTickets = async () => {
    try {
      setError(null);
      const response = await getMyTickets({
        status: selectedStatus || undefined,
      });
      if (response.ok && response.data) {
        // 转换后端数据格式到前端格式
        const transformedTickets = response.data.map((ticket: any) => ({
          ...ticket,
          event: ticket.event ? {
            ...ticket.event,
            startTime: ticket.event.date && ticket.event.time
              ? `${ticket.event.date}T${ticket.event.time}`
              : ticket.event.date,
            coverImage: ticket.event.cover,
          } : undefined,
        }));
        setTickets(transformedTickets);
      } else {
        // 检查是否是登录过期错误
        if (response.code === 'TOKEN_EXPIRED' || response.error?.includes('登录已过期')) {
          handleTokenExpired();
        } else {
          setError(response.error || '加载门票失败');
        }
      }
    } catch (err: any) {
      // 检查是否是登录过期错误
      if (err.message?.includes('登录已过期') || err.message?.includes('认证')) {
        handleTokenExpired();
      } else {
        setError(err.message || '加载门票失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTokenExpired = () => {
    Alert.alert(
      '登录已过期',
      '您的登录状态已过期，请重新登录',
      [
        {
          text: '重新登录',
          onPress: async () => {
            try {
              await logout();
              // 导航到登录页面
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('退出登录失败:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleTicketPress = (ticket: Ticket) => {
    navigation.navigate('TicketDetail' as never, { ticketId: ticket.id } as never);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => handleTicketPress(item)}
      activeOpacity={0.7}
    >
      {item.event?.coverImage ? (
        <Image source={{ uri: item.event.coverImage }} style={styles.ticketImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>🎫</Text>
        </View>
      )}

      <View style={styles.ticketContent}>
        <Text style={styles.eventName} numberOfLines={2}>
          {item.event?.name}
        </Text>
        <Text style={styles.tierName}>{item.tier?.name}</Text>
        <Text style={styles.eventInfo}>📍 {item.event?.venue}</Text>
        <Text style={styles.eventInfo}>
          🕐 {item.event?.startTime && formatDate(item.event.startTime)}
        </Text>
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketCode}>票号: {item.ticketCode}</Text>
          {item.status === 'used' && (
            <View style={styles.usedBadge}>
              <Text style={styles.usedText}>已使用</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 接收转让入口 */}
      <TouchableOpacity
        style={styles.receiveTransferBar}
        onPress={() => navigation.navigate('ReceiveTransfer' as never)}
        activeOpacity={0.7}
      >
        <Text style={styles.receiveTransferIcon}>🎁</Text>
        <View style={styles.receiveTransferContent}>
          <Text style={styles.receiveTransferTitle}>接收转让</Text>
          <Text style={styles.receiveTransferDesc}>输入转让码接收好友的门票</Text>
        </View>
        <Text style={styles.receiveTransferArrow}>›</Text>
      </TouchableOpacity>

      {/* 状态筛选标签 */}
      <View style={styles.filterTabs}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterTab,
              selectedStatus === filter.value && styles.filterTabActive,
            ]}
            onPress={() => setSelectedStatus(filter.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === filter.value && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>😕</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>下拉刷新重试</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🎫</Text>
              <Text style={styles.emptyMessage}>暂无门票</Text>
              <Text style={styles.emptyHint}>购买活动门票后会显示在这里</Text>
            </View>
          }
        />
      )}
    </View>
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
    backgroundColor: colors.background,
  },
  receiveTransferBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  receiveTransferIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  receiveTransferContent: {
    flex: 1,
  },
  receiveTransferTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  receiveTransferDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  receiveTransferArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  ticketImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  ticketContent: {
    padding: spacing.md,
  },
  eventName: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tierName: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  eventInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ticketCode: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  usedBadge: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  usedText: {
    fontSize: fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyMessage: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

