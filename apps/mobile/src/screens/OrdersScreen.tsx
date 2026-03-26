import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import { getMyOrders, cancelOrder, payOrder, refundOrder, type Order } from '../services/orders';
import OrderCard from '../components/OrderCard';

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    loadOrders(1);
  }, [selectedStatus]);

  const loadOrders = async (pageNum: number = page) => {
    try {
      setError(null);
      const response = await getMyOrders({
        status: selectedStatus || undefined,
        page: pageNum,
        limit: 20,
      });
      if (response.ok && response.data) {
        if (pageNum === 1) {
          setOrders(response.data);
        } else {
          setOrders((prev) => [...prev, ...response.data]);
        }
        // 如果返回的数据少于 20 条，说明没有更多了
        if (response.data.length < 20) {
          setHasMore(false);
        }
      } else {
        setError(response.error || '加载订单失败');
      }
    } catch (error: any) {
      setError(error.message || '加载订单失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadOrders(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage);
    }
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail' as never, { orderId: order.id } as never);
  };

  const handlePay = async (orderId: string) => {
    navigation.navigate('Payment' as never, { orderId } as never);
  };

  const handleCancel = async (orderId: string) => {
    Alert.alert('取消订单', '确定要取消这个订单吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确定取消',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await cancelOrder(orderId);
            if (response.ok) {
              Alert.alert('成功', '订单已取消');
              handleRefresh();
            } else {
              Alert.alert('失败', response.error || '取消订单失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '取消订单失败');
          }
        },
      },
    ]);
  };

  const handleRefund = async (orderId: string) => {
    Alert.alert('申请退款', '确定要申请退款吗？退款后门票将失效。', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确定退款',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await refundOrder(orderId);
            if (response.ok) {
              Alert.alert('成功', '退款申请已提交');
              handleRefresh();
            } else {
              Alert.alert('失败', response.error || '申请退款失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '申请退款失败');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              selectedStatus === tab.value && styles.tabActive,
            ]}
            onPress={() => setSelectedStatus(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                selectedStatus === tab.value && styles.tabTextActive,
              ]}
            >
              {tab.label}
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
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => handleOrderPress(item)}
              onPay={() => handlePay(item.id)}
              onCancel={() => handleCancel(item.id)}
              onRefund={() => handleRefund(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingMoreText}>加载中...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📝</Text>
              <Text style={styles.emptyMessage}>暂无订单</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyMessage: {
    fontSize: fontSize.lg,
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
