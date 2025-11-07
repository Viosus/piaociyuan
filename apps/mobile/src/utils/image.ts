/**
 * 图片处理工具函数
 */

/**
 * 获取图片 URL（处理相对路径和绝对路径）
 * @param imageUrl 图片 URL
 * @param baseUrl 基础 URL（可选）
 * @returns 完整的图片 URL
 */
export function getImageUrl(imageUrl?: string, baseUrl?: string): string {
  if (!imageUrl) {
    return getDefaultAvatar();
  }

  // 如果已经是完整 URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 如果提供了 baseUrl，拼接
  if (baseUrl) {
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // 否则返回原始 URL
  return imageUrl;
}

/**
 * 获取默认头像
 * @param seed 种子（用于生成唯一头像）
 * @returns 默认头像 URL
 */
export function getDefaultAvatar(seed?: string): string {
  const defaultSeed = seed || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultSeed}`;
}

/**
 * 获取预设头像列表
 * @returns 预设头像 URL 数组
 */
export function getPresetAvatars(): string[] {
  const seeds = [
    'Felix',
    'Aneka',
    'Jasmine',
    'Max',
    'Luna',
    'Charlie',
    'Oliver',
    'Lily',
    'Jack',
    'Emma',
    'Leo',
    'Sophie',
  ];
  return seeds.map((seed) => getDefaultAvatar(seed));
}

/**
 * 获取活动分类图标
 * @param category 活动分类
 * @returns 图标 emoji
 */
export function getCategoryIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    concert: '🎤',
    festival: '🎪',
    exhibition: '🎨',
    musicale: '🎻',
    show: '🎭',
    sports: '⚽',
    other: '📅',
  };
  return categoryIcons[category] || '📅';
}

/**
 * 获取活动分类名称
 * @param category 活动分类
 * @returns 分类名称
 */
export function getCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    concert: '演唱会',
    festival: '音乐节',
    exhibition: '展览',
    musicale: '音乐会',
    show: '演出',
    sports: '体育赛事',
    other: '其他',
  };
  return categoryNames[category] || '其他';
}

/**
 * 获取票状态文本
 * @param status 票状态
 * @returns 状态文本
 */
export function getTicketStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    available: '可售',
    locked: '已锁定',
    sold: '已售出',
    used: '已使用',
    refunded: '已退款',
  };
  return statusTexts[status] || status;
}

/**
 * 获取订单状态文本
 * @param status 订单状态
 * @returns 状态文本
 */
export function getOrderStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    PENDING: '待支付',
    PAID: '已支付',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  };
  return statusTexts[status] || status;
}

/**
 * 获取订单状态颜色
 * @param status 订单状态
 * @returns 状态颜色
 */
export function getOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    PENDING: '#F59E0B', // warning
    PAID: '#10B981', // success
    CANCELLED: '#6B7280', // gray
    REFUNDED: '#EF4444', // error
  };
  return statusColors[status] || '#6B7280';
}

/**
 * 获取 NFT 稀有度文本
 * @param rarity 稀有度
 * @returns 稀有度文本
 */
export function getRarityText(rarity: string): string {
  const rarityTexts: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传奇',
  };
  return rarityTexts[rarity] || rarity;
}

/**
 * 获取 NFT 稀有度颜色
 * @param rarity 稀有度
 * @returns 稀有度颜色
 */
export function getRarityColor(rarity: string): string {
  const rarityColors: Record<string, string> = {
    common: '#6B7280', // gray
    rare: '#3B82F6', // blue
    epic: '#8B5CF6', // purple
    legendary: '#F59E0B', // amber
  };
  return rarityColors[rarity] || '#6B7280';
}

/**
 * 压缩图片（占位符，实际实现需要使用 expo-image-manipulator）
 * @param uri 图片 URI
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的图片 URI
 */
export async function compressImage(
  uri: string,
  quality: number = 0.8
): Promise<string> {
  // TODO: 使用 expo-image-manipulator 实现图片压缩
  // import * as ImageManipulator from 'expo-image-manipulator';
  // const result = await ImageManipulator.manipulateAsync(
  //   uri,
  //   [{ resize: { width: 1000 } }],
  //   { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  // );
  // return result.uri;
  return uri;
}
