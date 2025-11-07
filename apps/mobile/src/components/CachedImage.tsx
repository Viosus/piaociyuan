import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { cacheImage, getCachedImageUri } from '../services/imageCache';
import { COLORS } from '../constants/config';

/**
 * CachedImage 组件属性
 */
interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  showLoadingIndicator?: boolean;
  fallbackSource?: number;
}

/**
 * 带缓存的图片组件
 *
 * 自动缓存网络图片，提升加载速度和用户体验
 */
export default function CachedImage({
  source,
  style,
  showLoadingIndicator = true,
  fallbackSource,
  ...imageProps
}: CachedImageProps) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    // 如果是本地资源，直接使用
    if (typeof source === 'number') {
      setLoading(false);
      return;
    }

    // 如果不是有效的网络 URL，直接使用
    const uri = source.uri;
    if (!uri || !uri.startsWith('http')) {
      setCachedUri(uri);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      // 首先检查是否已缓存
      const cached = await getCachedImageUri(uri);

      if (cached) {
        setCachedUri(cached);
        setLoading(false);
      } else {
        // 下载并缓存
        const path = await cacheImage(uri);
        setCachedUri(path);
        setLoading(false);
      }
    } catch (err) {
      console.error('加载图片失败:', err);
      setError(true);
      setLoading(false);

      // 如果有备用图片，使用备用图片
      if (fallbackSource) {
        // 备用图片会在下面的 render 中处理
      }
    }
  };

  // 获取图片源
  const getImageSource = () => {
    // 本地资源
    if (typeof source === 'number') {
      return source;
    }

    // 错误时使用备用图片
    if (error && fallbackSource) {
      return fallbackSource;
    }

    // 已缓存的图片
    if (cachedUri) {
      return { uri: cachedUri };
    }

    // 原始 URL（作为备用）
    return source;
  };

  // 计算样式
  const imageStyle = StyleSheet.flatten([styles.image, style]);

  return (
    <View style={[imageStyle, styles.container]}>
      <Image
        {...imageProps}
        source={getImageSource()}
        style={imageStyle}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />

      {/* 加载指示器 */}
      {loading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      {/* 错误占位符 */}
      {error && !fallbackSource && (
        <View style={[styles.errorContainer, imageStyle]}>
          <View style={styles.errorIcon}>
            <View style={styles.errorIconInner} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textSecondary,
  },
});
