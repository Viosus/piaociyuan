import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, GRADIENTS } from '../constants/config';
import { Carousel } from '../components/Carousel';
import { BannerCard } from '../components/BannerCard';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { SearchBar } from '../components/SearchBar';
import { CategoryNav } from '../components/CategoryNav';
import { SectionBlock } from '../components/SectionBlock';
import { getBanners, HeroBanner } from '../services/banners';
import { getHomepageSections, HomepageSection } from '../services/homepage';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [bannersData, sectionsData] = await Promise.all([
        getBanners(),
        getHomepageSections(),
      ]);

      setBanners(bannersData);
      setSections(sectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleRetry = () => {
    loadData();
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      (navigation as any).navigate('Search', { query });
    }
  };

  const handleSearchFocus = () => {
    (navigation as any).navigate('Search');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    navigation.navigate('Events' as never, { category: categoryId } as never);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={GRADIENTS.header as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.title}>票次元</Text>
          <Text style={styles.subtitle}>发现精彩活动</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => (navigation as any).navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.searchBarWrapper}
        activeOpacity={0.8}
        onPress={handleSearchFocus}
      >
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.searchPlaceholder}>搜索活动、艺人...</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Skeleton width="90%" height={180} style={{ marginBottom: spacing.md }} />
          <Skeleton width="90%" height={200} style={{ marginBottom: spacing.md }} />
          <Skeleton width="90%" height={200} />
        </View>
      </View>
    );
  }

  if (error && !isRefreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorState message={error} onRetry={handleRetry} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {renderHeader()}

      {/* 分类导航 */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      {/* Banner 轮播 */}
      {banners.length > 0 && (
        <View style={styles.bannerSection}>
          <Carousel
            data={banners}
            renderItem={(banner: HeroBanner) => <BannerCard banner={banner} />}
            autoPlay
            autoPlayInterval={3000}
            showIndicator
          />
        </View>
      )}

      {/* 首页栏目 */}
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {/* 如果没有栏目，显示占位 */}
      {sections.length === 0 && (
        <View style={styles.section}>
          <View style={styles.placeholder}>
            <Ionicons name="sparkles-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>暂无推荐内容</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchPlaceholder: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  bannerSection: {
    marginTop: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  placeholder: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
