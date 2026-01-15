/**
 * 地址管理页面
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import {
  getAddresses,
  deleteAddress,
  setDefaultAddress,
  formatFullAddress,
  ADDRESS_LABEL_LABELS,
  type UserAddress,
  type AddressLabel,
} from '../services/personalInfo';

export default function AddressesScreen() {
  const navigation = useNavigation();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 页面获取焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await getAddresses();
      if (response.ok && response.data) {
        setAddresses(response.data);
      } else {
        Alert.alert('错误', response.error || '获取地址列表失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '获取地址列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  const handleAdd = () => {
    navigation.navigate('AddAddress' as never);
  };

  const handleEdit = (address: UserAddress) => {
    navigation.navigate('AddAddress' as never, { address } as never);
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (address.isDefault) return;

    try {
      const response = await setDefaultAddress(address.id);
      if (response.ok) {
        // 更新本地状态
        setAddresses(addrs =>
          addrs.map(a => ({
            ...a,
            isDefault: a.id === address.id,
          }))
        );
      } else {
        Alert.alert('错误', response.error || '设置默认失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '设置默认失败');
    }
  };

  const handleDelete = (address: UserAddress) => {
    Alert.alert(
      '删除地址',
      `确定要删除 ${address.recipientName} 的收货地址吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAddress(address.id);
              if (response.ok) {
                setAddresses(addrs => addrs.filter(a => a.id !== address.id));
              } else {
                Alert.alert('错误', response.error || '删除失败');
              }
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除失败');
            }
          },
        },
      ]
    );
  };

  const getLabelIcon = (label?: AddressLabel): string => {
    switch (label) {
      case 'home':
        return '🏠';
      case 'work':
        return '🏢';
      default:
        return '📍';
    }
  };

  const renderAddressCard = (address: UserAddress) => (
    <TouchableOpacity
      key={address.id}
      style={styles.card}
      onPress={() => handleEdit(address)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.labelIcon}>{getLabelIcon(address.label as AddressLabel)}</Text>
          {address.label && (
            <Text style={styles.labelText}>
              {ADDRESS_LABEL_LABELS[address.label as AddressLabel] || address.label}
            </Text>
          )}
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>默认</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              '操作',
              '',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '设为默认',
                  onPress: () => handleSetDefault(address),
                },
                {
                  text: '删除',
                  style: 'destructive',
                  onPress: () => handleDelete(address),
                },
              ]
            );
          }}
        >
          <Text style={styles.moreIcon}>...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.recipientRow}>
          <Text style={styles.recipientName}>{address.recipientName}</Text>
          <Text style={styles.recipientPhone}>{address.recipientPhone}</Text>
        </View>
        <Text style={styles.addressText} numberOfLines={2}>
          {formatFullAddress(address)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {addresses.length > 0 ? (
          addresses.map(renderAddressCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>暂无收货地址</Text>
            <Text style={styles.emptyHint}>添加地址后可用于配送实体票和周边商品</Text>
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+ 添加地址</Text>
      </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelIcon: {
    fontSize: 20,
  },
  labelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: fontSize.xs,
    color: '#000',
    fontWeight: '600',
  },
  moreButton: {
    padding: spacing.sm,
  },
  moreIcon: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.xs,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  recipientName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  recipientPhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#000',
  },
});
