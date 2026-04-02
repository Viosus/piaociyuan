import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { getEvents, searchEvents, type Event, type EventFilters } from '../services/events';
import EventCard from '../components/EventCard';
import EventFilterSheet from '../components/EventFilterSheet';
import { SearchBar } from '../components/SearchBar';

const CATEGORY_TABS = [
  { id: 'all', label: '全部' },
  { id: 'concert', label: '演唱会' },
  { id: 'festival', label: '音乐节' },
  { id: 'exhibition', label: '展览' },
  { id: 'musicale', label: '音乐会' },
  { id: 'show', label: '演出' },
  { id: 'sports', label: '体育赛事' },
  { id: 'other', label: '其他' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_TABS.filter(t => t.id !== 'all').map(t => [t.id, t.label])
);

export default function EventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({ status: 'upcoming' });
  const [activeCategory, setActiveCategory] = useState('all');
  const underlineAnim = useRef(new Animated.Value(0)).current;

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载活动失败';
      setError(message);
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

  const handleCategorySelect = (categoryId: string, index: number) => {
    setActiveCategory(categoryId);
    Animated.spring(underlineAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
    if (categoryId === 'all') {
      setFilters({ ...filters, category: undefined });
    } else {
      setFilters({ ...filters, category: categoryId });
    }
    setSearchQuery('');
  };

  const handleApplyFilters = (newFilters: EventFilters) => {
    setFilters({ ...newFilters, status: 'upcoming' });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    return count;
  };

  const renderFilterTags = () => {
    const tags: { label: string; onRemove: () => void }[] = [];

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
              <Ionicons name="close" size={10} color="#ffffff" />
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
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>下拉刷新重试</Text>
      </View>
    );
  }

  const filterCount = getActiveFilterCount();

  return (
    <View style={styles.container}>
      {/* 搜索栏和筛选 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarFlex}>
            <SearchBar
              placeholder="搜索活动..."
              onSearch={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, filterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={20} color={filterCount > 0 ? COLORS.primary : COLORS.textSecondary} />
            {filterCount > 0 && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
        {renderFilterTags()}
      </View>

      {/* 分类 Tab 栏 */}
      <View style={styles.categoryTabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabScroll}
        >
          {CATEGORY_TABS.map((tab, index) => {
            const isActive = activeCategory === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.categoryTab}
                onPress={() => handleCategorySelect(tab.id, index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.categoryTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
            <Ionicons name="ticket-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyMessage}>暂无活动</Text>
            {(filterCount > 0 || activeCategory !== 'all') && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  setFilters({ status: 'upcoming' });
                  setActiveCategory('all');
                }}
              >
                <Text style={styles.clearFilterText}>清除筛选条件</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBarFlex: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.priceCTA,
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
    backgroundColor: `${COLORS.primary}12`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  filterTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
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
  categoryTabContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryTabScroll: {
    paddingHorizontal: SPACING.md,
  },
  categoryTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.xs,
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  categoryTabIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
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
    color: '#ffffff',
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
