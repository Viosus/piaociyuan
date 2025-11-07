import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

/**
 * 图片缓存服务
 *
 * 提供图片下载、缓存和管理功能，提升应用性能
 */

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 缓存目录
  cacheDir: FileSystem.cacheDirectory + 'images/',
  // 最大缓存大小（字节）100MB
  maxCacheSize: 100 * 1024 * 1024,
  // 缓存过期时间（毫秒）7天
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * 缓存元数据
 */
interface CacheMetadata {
  url: string;
  path: string;
  size: number;
  timestamp: number;
}

/**
 * 缓存存储
 */
let cacheMetadata: Map<string, CacheMetadata> = new Map();

/**
 * 初始化缓存目录
 */
async function initCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_CONFIG.cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_CONFIG.cacheDir, {
      intermediates: true,
    });
  }
}

/**
 * 生成缓存键（基于 URL）
 */
function getCacheKey(url: string): string {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    url
  ).then((hash) => hash);
}

/**
 * 获取缓存文件路径
 */
async function getCachePath(url: string): Promise<string> {
  const key = await getCacheKey(url);
  const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
  return `${CACHE_CONFIG.cacheDir}${key}.${extension}`;
}

/**
 * 检查缓存是否存在且有效
 */
export async function isCached(url: string): Promise<boolean> {
  try {
    const cachePath = await getCachePath(url);
    const fileInfo = await FileSystem.getInfoAsync(cachePath);

    if (!fileInfo.exists) {
      return false;
    }

    // 检查是否过期
    const key = await getCacheKey(url);
    const metadata = cacheMetadata.get(key);

    if (metadata) {
      const age = Date.now() - metadata.timestamp;
      if (age > CACHE_CONFIG.maxAge) {
        // 过期，删除缓存
        await FileSystem.deleteAsync(cachePath, { idempotent: true });
        cacheMetadata.delete(key);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('检查缓存失败:', error);
    return false;
  }
}

/**
 * 获取缓存的图片 URI
 */
export async function getCachedImageUri(url: string): Promise<string | null> {
  try {
    if (await isCached(url)) {
      return await getCachePath(url);
    }
    return null;
  } catch (error) {
    console.error('获取缓存图片失败:', error);
    return null;
  }
}

/**
 * 下载并缓存图片
 */
export async function cacheImage(url: string): Promise<string> {
  try {
    await initCacheDir();

    const cachePath = await getCachePath(url);
    const key = await getCacheKey(url);

    // 如果已缓存，直接返回
    if (await isCached(url)) {
      return cachePath;
    }

    // 下载图片
    const downloadResult = await FileSystem.downloadAsync(url, cachePath);

    if (downloadResult.status === 200) {
      // 获取文件大小
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // 保存元数据
      cacheMetadata.set(key, {
        url,
        path: cachePath,
        size,
        timestamp: Date.now(),
      });

      // 检查缓存大小，必要时清理
      await manageCacheSize();

      return cachePath;
    } else {
      throw new Error(`下载失败: HTTP ${downloadResult.status}`);
    }
  } catch (error: any) {
    console.error('缓存图片失败:', error);
    throw error;
  }
}

/**
 * 预加载图片列表
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map((url) => cacheImage(url).catch((error) => {
    console.warn(`预加载图片失败: ${url}`, error);
  }));

  await Promise.all(promises);
}

/**
 * 获取缓存大小
 */
export async function getCacheSize(): Promise<number> {
  try {
    let totalSize = 0;

    for (const metadata of cacheMetadata.values()) {
      totalSize += metadata.size;
    }

    return totalSize;
  } catch (error) {
    console.error('获取缓存大小失败:', error);
    return 0;
  }
}

/**
 * 管理缓存大小（删除最旧的文件）
 */
async function manageCacheSize(): Promise<void> {
  try {
    const currentSize = await getCacheSize();

    if (currentSize > CACHE_CONFIG.maxCacheSize) {
      // 按时间戳排序（最旧的在前）
      const sortedEntries = Array.from(cacheMetadata.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      let sizeToFree = currentSize - CACHE_CONFIG.maxCacheSize;

      for (const [key, metadata] of sortedEntries) {
        if (sizeToFree <= 0) break;

        await FileSystem.deleteAsync(metadata.path, { idempotent: true });
        cacheMetadata.delete(key);
        sizeToFree -= metadata.size;
      }

      console.log(`清理缓存完成，释放 ${currentSize - await getCacheSize()} 字节`);
    }
  } catch (error) {
    console.error('管理缓存大小失败:', error);
  }
}

/**
 * 清除所有缓存
 */
export async function clearCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(CACHE_CONFIG.cacheDir, { idempotent: true });
    await initCacheDir();
    cacheMetadata.clear();
    console.log('缓存已清除');
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

/**
 * 清除过期缓存
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, metadata] of cacheMetadata.entries()) {
      const age = now - metadata.timestamp;
      if (age > CACHE_CONFIG.maxAge) {
        await FileSystem.deleteAsync(metadata.path, { idempotent: true });
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => cacheMetadata.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`清除 ${expiredKeys.length} 个过期缓存`);
    }
  } catch (error) {
    console.error('清除过期缓存失败:', error);
  }
}

/**
 * 删除单个缓存
 */
export async function removeCachedImage(url: string): Promise<void> {
  try {
    const cachePath = await getCachePath(url);
    const key = await getCacheKey(url);

    await FileSystem.deleteAsync(cachePath, { idempotent: true });
    cacheMetadata.delete(key);
  } catch (error) {
    console.error('删除缓存失败:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{
  count: number;
  size: number;
  sizeFormatted: string;
}> {
  const size = await getCacheSize();
  const count = cacheMetadata.size;

  return {
    count,
    size,
    sizeFormatted: formatBytes(size),
  };
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 初始化缓存服务
 */
export async function initImageCache(): Promise<void> {
  try {
    await initCacheDir();

    // 清理过期缓存
    await clearExpiredCache();

    // 加载缓存元数据
    const dirContents = await FileSystem.readDirectoryAsync(CACHE_CONFIG.cacheDir);

    for (const filename of dirContents) {
      const filePath = CACHE_CONFIG.cacheDir + filename;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists && 'size' in fileInfo && 'modificationTime' in fileInfo) {
        // 使用文件名作为 key（不完美，但足够用）
        const key = filename.split('.')[0];
        cacheMetadata.set(key, {
          url: '', // URL 信息丢失，但不影响缓存管理
          path: filePath,
          size: fileInfo.size,
          timestamp: fileInfo.modificationTime * 1000,
        });
      }
    }

    console.log(`图片缓存已初始化: ${cacheMetadata.size} 个文件`);
  } catch (error) {
    console.error('初始化图片缓存失败:', error);
  }
}
