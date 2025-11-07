import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { spacing } from '../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  itemWidth?: number;
  itemSpacing?: number;
  showIndicator?: boolean;
  indicatorColor?: string;
  indicatorActiveColor?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  data,
  renderItem,
  autoPlay = true,
  autoPlayInterval = 3000,
  itemWidth = SCREEN_WIDTH - spacing.lg * 2,
  itemSpacing = spacing.md,
  showIndicator = true,
  indicatorColor = '#E5E7EB',
  indicatorActiveColor = '#6366F1',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // 自动轮播
  useEffect(() => {
    if (autoPlay && data.length > 1) {
      autoPlayTimer.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % data.length;
        scrollToIndex(nextIndex);
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimer.current) {
          clearInterval(autoPlayTimer.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, currentIndex, data.length]);

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      const offset = index * (itemWidth + itemSpacing);
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
      setCurrentIndex(index);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (itemWidth + itemSpacing));
    setCurrentIndex(index);
  };

  const handleScrollBeginDrag = () => {
    // 用户开始拖动时，停止自动轮播
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  };

  const handleScrollEndDrag = () => {
    // 用户停止拖动后，重新启动自动轮播
    if (autoPlay && data.length > 1) {
      autoPlayTimer.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % data.length;
        scrollToIndex(nextIndex);
      }, autoPlayInterval);
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={itemWidth + itemSpacing}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg },
        ]}
      >
        {data.map((item, index) => (
          <View
            key={index}
            style={[styles.itemContainer, { width: itemWidth, marginRight: itemSpacing }]}
          >
            {renderItem(item, index)}
          </View>
        ))}
      </ScrollView>

      {showIndicator && data.length > 1 && (
        <View style={styles.indicatorContainer}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentIndex ? indicatorActiveColor : indicatorColor,
                  width: index === currentIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  itemContainer: {
    // 容器样式
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    transition: 'width 0.3s',
  },
});
