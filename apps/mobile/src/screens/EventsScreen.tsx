import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { getEvents, searchEvents, type Event } from '../services/events';
import EventCard from '../components/EventCard';

export default function EventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setError(null);
      const response = await getEvents({ status: 'upcoming' });
      if (response.ok && response.data) {
        setEvents(response.data);
      } else {
        setError(response.error || '加载活动失败');
      }
    } catch (err: any) {
      setError(err.message || '加载活动失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索活动..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={COLORS.textSecondary}
        />
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
          </View>
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
  searchInput: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
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
