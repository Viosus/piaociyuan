import { apiClient } from './api';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  color?: string;  // 背景颜色
  order: number;
  isActive: boolean;
}

/**
 * 获取首页轮播广告
 */
export async function getBanners(): Promise<HeroBanner[]> {
  try {
    const response = await apiClient.get<HeroBanner[]>('/api/banners', {
      cache: true,
      cacheTime: 10 * 60 * 1000, // 缓存 10 分钟
    });

    if (response.ok && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    return [];
  }
}
