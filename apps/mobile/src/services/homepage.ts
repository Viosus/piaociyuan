import { apiClient } from './api';

export interface HomepageSection {
  id: number;
  title: string;
  subtitle?: string;
  icon?: string;
  bgGradient?: string;
  moreLink?: string;
  events: any[]; // 可以根据需要定义更详细的 Event 类型
}

/**
 * 获取首页栏目数据
 */
export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const response = await apiClient.get<HomepageSection[]>('/api/homepage-sections', {
      cache: true,
      cacheTime: 5 * 60 * 1000, // 缓存 5 分钟
    });

    if (response.ok && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch homepage sections:', error);
    return [];
  }
}
