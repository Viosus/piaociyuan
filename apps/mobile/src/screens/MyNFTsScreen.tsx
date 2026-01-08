import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NFTCard from '../components/NFTCard';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import { getUserNFTs, type UserNFT, type NFTRarity } from '../services/nft';

// 稀有度筛选选项
const RARITY_FILTERS: Array<{ label: string; value: NFTRarity | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '传说', value: 'legendary' },
  { label: '史诗', value: 'epic' },
  { label: '稀有', value: 'rare' },
  { label: '普通', value: 'common' },
];

export default function MyNFTsScreen() {
  const navigation = useNavigation();

  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<NFTRarity | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    legendary: 0,
    epic: 0,
    rare: 0,
    common: 0,
  });

  useEffect(() => {
    loadNFTs();
  }, [selectedRarity]);

  const loadNFTs = async () => {
    try {
      const params =
        selectedRarity === 'all' ? {} : { rarity: selectedRarity as NFTRarity };
      const result = await getUserNFTs(params);

      if (result.success && result.data) {
        setNfts(result.data.data);
        setStats({
          total: result.data.stats.total,
          legendary: result.data.stats.byRarity.legendary,
          epic: result.data.stats.byRarity.epic,
          rare: result.data.stats.byRarity.rare,
          common: result.data.stats.byRarity.common,
        });
      } else {
        Alert.alert('错误', result.error || '加载 NFT 列表失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载 NFT 列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNFTs();
  };

  const handleNFTPress = (nft: UserNFT) => {
    navigation.navigate('NFTDetail' as never, { nftId: nft.id } as never);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 统计卡片 */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>总藏品</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.legendary}
            </Text>
            <Text style={styles.statLabel}>传说</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
              {stats.epic}
            </Text>
            <Text style={styles.statLabel}>史诗</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {stats.rare}
            </Text>
            <Text style={styles.statLabel}>稀有</Text>
          </View>
        </View>
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>稀有度筛选</Text>
        <View style={styles.filterTabs}>
          {RARITY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterTab,
                selectedRarity === filter.value && styles.filterTabActive,
              ]}
              onPress={() => setSelectedRarity(filter.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedRarity === filter.value && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderNFTItem = ({ item, index }: { item: UserNFT; index: number }) => {
    // 两列布局，需要添加左右间距
    const isLeftColumn = index % 2 === 0;
    return (
      <View
        style={[
          styles.nftItemContainer,
          isLeftColumn && styles.nftItemLeft,
          !isLeftColumn && styles.nftItemRight,
        ]}
      >
        <NFTCard nft={item} onPress={() => handleNFTPress(item)} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="diamond-outline"
        title="暂无 NFT 藏品"
        description="您还没有任何 NFT 数字藏品\n购票后可铸造专属 NFT"
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
        data={nfts}
        renderItem={renderNFTItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        numColumns={2}
        columnWrapperStyle={styles.row}
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

      {/* 铸造入口 */}
      {!loading && nfts.length > 0 && (
        <TouchableOpacity
          style={styles.mintButton}
          onPress={() => navigation.navigate('MintNFT' as never)}
        >
          <Ionicons name="hammer" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  row: {
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.small,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  nftItemContainer: {
    width: '48%',
  },
  nftItemLeft: {
    marginRight: '2%',
  },
  nftItemRight: {
    marginLeft: '2%',
  },
  mintButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
