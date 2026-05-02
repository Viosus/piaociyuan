import React, { useState, useEffect, useCallback } from 'react';
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
import TicketFilterSheet, { type TicketFilters } from '../components/TicketFilterSheet';
import { ErrorState } from '../components/ErrorState';

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

// 类别标签配置
const CATEGORY_LABELS: Record<string, string> = {
  concert: '演唱会',
  festival: '音乐节',
  exhibition: '展览',
  musicale: '音乐会',
  show: '演出',
  sports: '体育赛事',
  other: '其他',
};

export default function TicketsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});

  useEffect(() => {
    loadTickets();
  }, [selectedStatus, filters]);

  const loadTickets = useCallback(async () => {
    try {
      setError(null);
      const response = await getMyTickets({
        status: (selectedStatus || undefined) as 'available' | 'sold' | 'used' | 'refunded' | undefined,
        ...filters,
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
            coverImage: ticket.event.coverImage || ticket.event.cover,
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
    } catch (error: any) {
      // 检查是否是登录过期错误
      if (error.message?.includes('登录已过期') || error.message?.includes('认证')) {
        handleTokenExpired();
      } else {
        setError(error.message || '加载门票失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, filters]);

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
                routes: [{ name: 'Login' }],
              });
            } catch {
              // 静默处理退出登录失败
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
    navigation.navigate('TicketDetail', { ticketId: ticket.id });
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

  const handleApplyFilters = (newFilters: TicketFilters) => {
    setFilters(newFilters);
  };

  // 计算当前激活的筛选器数量
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  };

  // 渲染当前筛选条件标签
  const renderFilterTags = () => {
    const tags: { label: string; onRemove: () => void }[] = [];

    if (filters.category) {
      tags.push({
        label: CATEGORY_LABELS[filters.category] || filters.category,
        onRemove: () => setFilters({ ...filters, category: undefined }),
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} ~ ${filters.dateTo}`
        : filters.dateFrom || filters.dateTo;
      tags.push({
        label: `日期: ${dateLabel}`,
        onRemove: () => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined }),
      });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceLabel = filters.minPrice !== undefined && filters.maxPrice !== undefined
        ? `¥${filters.minPrice} - ¥${filters.maxPrice}`
        : filters.minPrice !== undefined
          ? `¥${filters.minPrice}起`
          : `¥${filters.maxPrice}以内`;
      tags.push({
        label: priceLabel,
        onRemove: () => setFilters({ ...filters, minPrice: undefined, maxPrice: undefined }),
      });
    }


    if (tags.length === 0) return null;

    return (
      <View style={styles.filterTagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.filterTag}>
            <Text style={styles.filterTagText}>{tag.label}</Text>
            <TouchableOpacity onPress={tag.onRemove} style={styles.filterTagRemove}>
              <Text style={styles.filterTagRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const filterCount = getActiveFilterCount();

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
        onPress={() => navigation.navigate('ReceiveTransfer')}
        activeOpacity={0.7}
      >
        <Text style={styles.receiveTransferIcon}>🎁</Text>
        <View style={styles.receiveTransferContent}>
          <Text style={styles.receiveTransferTitle}>接收转让</Text>
          <Text style={styles.receiveTransferDesc}>输入转让码接收好友的门票</Text>
        </View>
        <Text style={styles.receiveTransferArrow}>›</Text>
      </TouchableOpacity>

      {/* 状态筛选标签和筛选按钮 */}
      <View style={styles.filterSection}>
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
          <TouchableOpacity
            style={[styles.advancedFilterButton, filterCount > 0 && styles.advancedFilterButtonActive]}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.advancedFilterIcon}>🔍</Text>
            <Text style={[styles.advancedFilterText, filterCount > 0 && styles.advancedFilterTextActive]}>
              筛选{filterCount > 0 ? ` (${filterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 筛选条件标签 */}
        {renderFilterTags()}
      </View>

      {error ? (
        <ErrorState message={error} onRetry={loadTickets} />
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
              <Text style={styles.emptyHint}>
                {filterCount > 0 ? '没有符合筛选条件的门票' : '购买活动门票后会显示在这里'}
              </Text>
              {filterCount > 0 && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setFilters({})}
                >
                  <Text style={styles.clearFilterText}>清除筛选条件</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* 筛选弹窗 */}
      <TicketFilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
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
  filterSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 'auto',
  },
  advancedFilterButtonActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  advancedFilterIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  advancedFilterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  advancedFilterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  filterTagText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  filterTagRemove: {
    marginLeft: spacing.xs,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTagRemoveText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  clearFilterButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  clearFilterText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  ticketCard: {
    backgroundColor: colors.surface,
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
    color: colors.textOnPrimary,
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

