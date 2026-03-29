import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserCollectibles, UserCollectible } from '../services/collectibles';
import { COLORS } from '../constants/config';

export default function MyCollectiblesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<UserCollectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      const data = await getUserCollectibles(pageNum);
      if (isRefresh) {
        setItems(data.items);
      } else {
        setItems((prev) => (pageNum === 1 ? data.items : [...prev, ...data.items]));
      }
      setHasMore(pageNum < data.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage);
  };

  const categoryLabels: Record<string, string> = {
    badge: '徽章',
    ticket_stub: '票根',
    poster: '海报',
    certificate: '证书',
    art: '艺术品',
  };

  const renderItem = ({ item }: { item: UserCollectible }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CollectibleDetail', { id: item.id })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.collectible.imageUrl }} style={styles.image} />
      {item.collectible.has3DModel && (
        <View style={styles.badge3D}>
          <Text style={styles.badge3DText}>3D</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.collectible.name}
        </Text>
        <Text style={styles.cardCategory}>
          {categoryLabels[item.collectible.category] || item.collectible.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyText}>还没有收藏品</Text>
          <Text style={styles.emptySubText}>购票参加活动后即可获得专属收藏品</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.surface },
  badge3D: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badge3DText: { color: COLORS.textOnPrimary, fontSize: 11, fontWeight: '600' },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cardCategory: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6 },
});
