import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
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

      // 并行加载 Banner 和栏目数据
      const [bannersData, sectionsData] = await Promise.all([
        getBanners(),
        getHomepageSections(),
      ]);

      setBanners(bannersData);
      setSections(sectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('Failed to load home data:', err);
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
    // 跳转到搜索页面（稍后实现）
    console.log('Search:', query);
  };

  const handleSearchFocus = () => {
    // 跳转到专门的搜索页面
    // navigation.navigate('Search' as never);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 可以跳转到活动列表页并筛选对应分类
    navigation.navigate('Events' as never, { category: categoryId } as never);
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>票次元</Text>
          <Text style={styles.subtitle}>发现精彩活动</Text>
        </View>
        <SearchBar editable={false} />
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
        <View style={styles.header}>
          <Text style={styles.title}>票次元</Text>
          <Text style={styles.subtitle}>发现精彩活动</Text>
        </View>
        <SearchBar editable={false} />
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
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>票次元</Text>
        <Text style={styles.subtitle}>发现精彩活动</Text>
      </View>

      {/* 搜索栏 */}
      <SearchBar
        onSearch={handleSearch}
        onFocus={handleSearchFocus}
        editable={true}
      />

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
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: '#ffffff',
    opacity: 0.9,
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
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
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
  },
});
