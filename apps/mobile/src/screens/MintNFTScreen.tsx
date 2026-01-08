import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import { getMintableOrders, requestMintNFT, getWalletStatus, type MintableOrder } from '../services/nft';

export default function MintNFTScreen() {
  const navigation = useNavigation();

  const [orders, setOrders] = useState<MintableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minting, setMinting] = useState<Record<number, boolean>>({});
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 检查钱包状态
      const walletResult = await getWalletStatus();
      if (walletResult.success && walletResult.data) {
        setHasWallet(walletResult.data.isBound);
      }

      // 加载可铸造订单
      const ordersResult = await getMintableOrders();
      if (ordersResult.success && ordersResult.data) {
        setOrders(ordersResult.data);
      } else {
        Alert.alert('错误', ordersResult.error || '加载订单列表失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMintNFT = async (order: MintableOrder) => {
    if (!hasWallet) {
      Alert.alert(
        '提示',
        '您还未绑定钱包地址，请先绑定钱包',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '去绑定',
            onPress: () => navigation.navigate('BindWallet' as never),
          },
        ]
      );
      return;
    }

    if (order.nftMinted) {
      Alert.alert('提示', '该订单已铸造 NFT');
      return;
    }

    if (!order.canMintNFT) {
      Alert.alert('提示', '该订单暂时不能铸造 NFT');
      return;
    }

    Alert.alert(
      '确认铸造',
      `确定要为订单 #${order.id} 铸造 NFT 吗？\n\n活动：${order.event.name}\n票档：${order.tier.name}\n数量：${order.qty} 张`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认',
          onPress: async () => {
            setMinting((prev) => ({ ...prev, [order.id]: true }));
            try {
              const result = await requestMintNFT({ orderId: order.id });

              if (result.success && result.data) {
                Alert.alert(
                  '铸造请求已提交',
                  `您的 NFT 铸造请求已加入队列\n预计等待时间：${result.data.estimatedTime}`,
                  [
                    {
                      text: '确定',
                      onPress: () => {
                        loadData();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('错误', result.error || '铸造请求失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '铸造请求失败');
            } finally {
              setMinting((prev) => ({ ...prev, [order.id]: false }));
            }
          },
        },
      ]
    );
  };

  const renderOrderItem = ({ item }: { item: MintableOrder }) => {
    const isMinting = minting[item.id] || false;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Image
            source={{ uri: item.event.imageUrl }}
            style={styles.eventImage}
            resizeMode="cover"
          />
          <View style={styles.orderInfo}>
            <Text style={styles.eventName} numberOfLines={2}>
              {item.event.name}
            </Text>
            <View style={styles.tierInfo}>
              <Ionicons name="pricetag" size={14} color={COLORS.textSecondary} />
              <Text style={styles.tierName}>{item.tier.name}</Text>
            </View>
            <View style={styles.qtyInfo}>
              <Ionicons name="ticket" size={14} color={COLORS.textSecondary} />
              <Text style={styles.qtyText}>{item.qty} 张</Text>
            </View>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.statusContainer}>
            {item.nftMinted ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={[styles.statusText, { color: COLORS.success }]}>
                  已铸造
                </Text>
              </>
            ) : item.canMintNFT ? (
              <>
                <Ionicons name="time" size={16} color={COLORS.warning} />
                <Text style={[styles.statusText, { color: COLORS.warning }]}>
                  可铸造
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color={COLORS.error} />
                <Text style={[styles.statusText, { color: COLORS.error }]}>
                  不可铸造
                </Text>
              </>
            )}
          </View>

          <Button
            title={isMinting ? '铸造中...' : item.nftMinted ? '已铸造' : '铸造 NFT'}
            onPress={() => handleMintNFT(item)}
            disabled={isMinting || item.nftMinted || !item.canMintNFT}
            size="small"
            style={styles.mintButton}
          />
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>关于 NFT 铸造</Text>
          <Text style={styles.infoText}>
            购买门票后，您可以将门票铸造为独特的 NFT 数字藏品。铸造完成后，NFT 将发送到您绑定的钱包地址。
          </Text>
        </View>
      </View>

      {!hasWallet && (
        <TouchableOpacity
          style={styles.bindWalletCard}
          onPress={() => navigation.navigate('BindWallet' as never)}
        >
          <Ionicons name="wallet" size={24} color={COLORS.primary} />
          <View style={styles.bindWalletContent}>
            <Text style={styles.bindWalletTitle}>绑定钱包</Text>
            <Text style={styles.bindWalletDescription}>
              铸造 NFT 前需要先绑定以太坊钱包
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      <Text style={styles.listTitle}>可铸造订单 ({orders.length})</Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="cube-outline"
        title="暂无可铸造订单"
        description="购票后即可在此铸造 NFT"
        actionText="去购票"
        onAction={() => navigation.navigate('Events' as never)}
      />
    );
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: SPACING.md,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bindWalletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bindWalletContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  bindWalletTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bindWalletDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.small,
    marginRight: SPACING.md,
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tierName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  qtyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  mintButton: {
    paddingHorizontal: SPACING.lg,
  },
});
