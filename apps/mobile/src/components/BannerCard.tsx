import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing } from '../constants/config';
import type { HeroBanner } from '../services/banners';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 默认渐变色
const DEFAULT_GRADIENT = ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)'];

interface BannerCardProps {
  banner: HeroBanner;
  width?: number;
  height?: number;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  banner,
  width = SCREEN_WIDTH - spacing.lg * 2,
  height = 180,
}) => {
  const handlePress = async () => {
    if (banner.link) {
      try {
        const canOpen = await Linking.canOpenURL(banner.link);
        if (canOpen) {
          await Linking.openURL(banner.link);
        }
      } catch {
        // 静默处理链接打开失败
      }
    }
  };

  const Container = banner.link ? TouchableOpacity : View;

  // 使用默认渐变色
  const gradientColors = DEFAULT_GRADIENT;

  return (
    <Container
      style={[styles.container, { width, height }]}
      onPress={banner.link ? handlePress : undefined}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: banner.image }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {banner.title}
            </Text>
            {banner.subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {banner.subtitle}
              </Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    borderRadius: 12,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  content: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
