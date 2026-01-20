import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearBadge,
  type AppNotification,
  type NotificationType,
} from '../services/notifications';

/**
 * 通知类型配置
 */
const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: string; color: string }
> = {
  event_reminder: { label: '活动提醒', icon: 'calendar', color: '#F59E0B' },
  order_status: { label: '订单状态', icon: 'receipt', color: '#3B82F6' },
  ticket_status: { label: '门票状态', icon: 'ticket', color: '#10B981' },
  post_like: { label: '点赞', icon: 'heart', color: '#EF4444' },
  post_comment: { label: '评论', icon: 'chatbubble', color: '#8B5CF6' },
  new_follower: { label: '新粉丝', icon: 'person-add', color: '#06B6D4' },
  new_message: { label: '新消息', icon: 'mail', color: '#EC4899' },
  nft_minted: { label: 'NFT铸造', icon: 'cube', color: '#6366F1' },
  system: { label: '系统通知', icon: 'notifications', color: '#6B7280' },
};

/**
 * 通知筛选类型
 */
type FilterType = 'all' | NotificationType;

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // 清除角标
    clearBadge();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const params = filter === 'all' ? {} : { type: filter };
      const result = await getNotifications(params);

      if (result.ok && result.data) {
        setNotifications(result.data.data);
        setUnreadCount(result.data.data.filter((n) => !n.isRead).length);
      } else {
        Alert.alert('错误', result.error || '加载通知列表失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载通知失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    // 标记为已读
    if (!notification.isRead) {
      const result = await markNotificationAsRead(notification.id);
      if (result.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }

    // 根据通知类型导航到相应页面
    const { type, data } = notification;

    switch (type) {
      case 'event_reminder':
        if (data?.eventId) {
          navigation.navigate('EventDetail' as never, { eventId: data.eventId } as never);
        }
        break;
      case 'order_status':
        if (data?.orderId) {
          navigation.navigate('OrderDetail' as never, { orderId: data.orderId } as never);
        }
        break;
      case 'ticket_status':
        if (data?.ticketId) {
          navigation.navigate('TicketDetail' as never, { ticketId: data.ticketId } as never);
        }
        break;
      case 'post_like':
      case 'post_comment':
        if (data?.postId) {
          navigation.navigate('PostDetail' as never, { id: data.postId } as never);
        }
        break;
      case 'new_follower':
        if (data?.userId) {
          navigation.navigate('UserProfile' as never, { userId: data.userId } as never);
        }
        break;
      case 'new_message':
        if (data?.conversationId) {
          navigation.navigate('Chat' as never, { conversationId: data.conversationId } as never);
        }
        break;
      case 'nft_minted':
        if (data?.nftId) {
          navigation.navigate('NFTDetail' as never, { nftId: data.nftId } as never);
        }
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      Alert.alert('提示', '暂无未读通知');
      return;
    }

    try {
      const result = await markAllNotificationsAsRead();
      if (result.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        Alert.alert('成功', '已标记所有通知为已读');
      } else {
        Alert.alert('错误', result.error || '标记失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '标记失败');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    Alert.alert('确认删除', '确定要删除这条通知吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteNotification(id);
            if (result.ok) {
              const notification = notifications.find((n) => n.id === id);
              setNotifications((prev) => prev.filter((n) => n.id !== id));
              if (notification && !notification.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            } else {
              Alert.alert('错误', result.error || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '删除失败');
          }
        },
      },
    ]);
  };

  const renderFilterTabs = () => {
    const filters: { key: FilterType; label: string }[] = [
      { key: 'all', label: '全部' },
      { key: 'event_reminder', label: '活动' },
      { key: 'order_status', label: '订单' },
      { key: 'post_like', label: '互动' },
      { key: 'new_message', label: '消息' },
      { key: 'nft_minted', label: 'NFT' },
      { key: 'system', label: '系统' },
    ];

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === item.key && styles.filterTabActive]}
              onPress={() => {
                setFilter(item.key);
                setLoading(true);
              }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === item.key && styles.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>
    );
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const config = NOTIFICATION_TYPE_CONFIG[item.type];
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>

          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>{timeAgo}</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{config.label}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>通知中心</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
            <Text style={styles.markAllText}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>
      {unreadCount > 0 && (
        <Text style={styles.unreadCountText}>
          您有 {unreadCount} 条未读通知
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="notifications-outline"
        title="暂无通知"
        description={filter === 'all' ? '您还没有收到任何通知' : '该类型暂无通知'}
      />
    );
  };

  if (loading && !refreshing) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <View style={styles.container}>
      {renderFilterTabs()}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

/**
 * 计算相对时间
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: `${COLORS.primary}10`,
  },
  markAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  unreadCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationItemUnread: {
    backgroundColor: `${COLORS.primary}05`,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  notificationBody: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  notificationBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.background,
  },
  notificationBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
  },
});
