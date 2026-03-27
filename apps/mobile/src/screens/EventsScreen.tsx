import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { getEvents, searchEvents, type Event, type EventFilters } from '../services/events';
import EventCard from '../components/EventCard';
import EventFilterSheet from '../components/EventFilterSheet';

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

export default function EventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({ status: 'upcoming' });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const response = await getEvents(filters);
      if (response.ok && response.data) {
        setEvents(response.data);
      } else {
        setError(response.error || '加载活动失败');
      }
    } catch (error: any) {
      setError(error.message || '加载活动失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      try {
        const response = await searchEvents(text);
        if (response.ok && response.data) {
          setEvents(response.data);
        }
      } catch {
        // 静默处理搜索失败
      }
    } else {
      loadEvents();
    }
  };

  const handleApplyFilters = (newFilters: EventFilters) => {
    setFilters({ ...newFilters, status: 'upcoming' });
    setSearchQuery(''); // 清空搜索词
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

  const handleEventPress = (event: Event) => {
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>😕</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>下拉刷新重试</Text>
      </View>
    );
  }

  const filterCount = getActiveFilterCount();

  return (
    <View style={styles.container}>
      {/* 搜索栏和筛选按钮 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索活动..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity
            style={[styles.filterButton, filterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilter(true)}
          >
            <Text style={styles.filterIcon}>🔍</Text>
            <Text style={[styles.filterButtonText, filterCount > 0 && styles.filterButtonTextActive]}>
              筛选{filterCount > 0 ? ` (${filterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 筛选条件标签 */}
        {renderFilterTags()}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎫</Text>
            <Text style={styles.emptyMessage}>暂无活动</Text>
            {filterCount > 0 && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setFilters({ status: 'upcoming' })}
              >
                <Text style={styles.clearFilterText}>清除筛选条件</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* 筛选弹窗 */}
      <EventFilterSheet
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
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  filterTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  filterTagRemove: {
    marginLeft: SPACING.xs,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTagRemoveText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  clearFilterButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  clearFilterText: {
    fontSize: FONT_SIZES.sm,
    color: '#000',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
