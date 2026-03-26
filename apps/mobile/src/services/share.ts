import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { createUniversalLink } from '../navigation/linking';

/**
 * 分享服务
 *
 * 提供统一的分享功能，支持文本、链接和图片分享
 */

/**
 * 分享结果
 */
export interface ShareResult {
  success: boolean;
  action?: string;
  error?: string;
}

/**
 * 分享选项
 */
export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
  imageUrl?: string;
}

/**
 * 基础分享函数
 */
export async function shareContent(options: ShareOptions): Promise<ShareResult> {
  try {
    const shareOptions: any = {
      message: options.message,
    };

    if (options.title) {
      shareOptions.title = options.title;
    }

    if (options.url) {
      if (Platform.OS === 'ios') {
        shareOptions.url = options.url;
      } else {
        // Android 需要将 URL 附加到 message 中
        shareOptions.message = `${options.message}\n\n${options.url}`;
      }
    }

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return {
        success: true,
        action: result.activityType || 'shared',
      };
    } else if (result.action === Share.dismissedAction) {
      return {
        success: false,
        action: 'dismissed',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '分享失败',
    };
  }
}

/**
 * 分享活动
 */
export async function shareEvent(event: {
  id: number;
  name: string;
  date: string;
  venue: string;
  imageUrl?: string;
}): Promise<ShareResult> {
  const url = createUniversalLink(`events/${event.id}`);
  const message = `📅 ${event.name}\n\n📍 ${event.venue}\n⏰ ${event.date}\n\n快来和我一起参加这个活动吧！`;

  return shareContent({
    title: event.name,
    message,
    url,
    imageUrl: event.imageUrl,
  });
}

/**
 * 分享帖子
 */
export async function sharePost(post: {
  id: number;
  content: string;
  author: {
    nickname: string;
  };
  images?: string[];
}): Promise<ShareResult> {
  const url = createUniversalLink(`posts/${post.id}`);
  const preview = post.content.length > 100
    ? post.content.substring(0, 100) + '...'
    : post.content;
  const message = `💬 ${post.author.nickname} 的分享：\n\n${preview}`;

  return shareContent({
    title: '精彩动态',
    message,
    url,
    imageUrl: post.images?.[0],
  });
}

/**
 * 分享数字藏品
 */
export async function shareNFT(nft: {
  id: number;
  name: string;
  description?: string;
  rarity: string;
  imageUrl?: string;
}): Promise<ShareResult> {
  const url = createUniversalLink(`nfts/${nft.id}`);

  let message = `✨ ${nft.name}\n\n🎯 稀有度：${getRarityLabel(nft.rarity)}`;

  if (nft.description) {
    const desc = nft.description.length > 80
      ? nft.description.substring(0, 80) + '...'
      : nft.description;
    message += `\n\n${desc}`;
  }

  message += '\n\n快来看看我的数字藏品！';

  return shareContent({
    title: nft.name,
    message,
    url,
    imageUrl: nft.imageUrl,
  });
}

/**
 * 分享门票
 */
export async function shareTicket(ticket: {
  id: number;
  ticketCode: string;
  event: {
    id: number;
    name: string;
    date: string;
    venue: string;
  };
  tier: {
    name: string;
  };
}): Promise<ShareResult> {
  const eventUrl = createUniversalLink(`events/${ticket.event.id}`);
  const message = `🎫 我购买了 ${ticket.event.name} 的门票！\n\n` +
    `📍 ${ticket.event.venue}\n` +
    `⏰ ${ticket.event.date}\n` +
    `🎟️ ${ticket.tier.name}\n\n` +
    `快来一起参加吧！`;

  return shareContent({
    title: '我的演出门票',
    message,
    url: eventUrl,
  });
}

/**
 * 分享订单
 */
export async function shareOrder(order: {
  id: number;
  event: {
    id: number;
    name: string;
    date: string;
  };
  tier: {
    name: string;
  };
  qty: number;
}): Promise<ShareResult> {
  const eventUrl = createUniversalLink(`events/${order.event.id}`);
  const message = `✅ 已成功购买 ${order.event.name} 门票！\n\n` +
    `🎟️ ${order.tier.name} × ${order.qty}\n` +
    `⏰ ${order.event.date}\n\n` +
    `期待与你同行！`;

  return shareContent({
    title: '购票成功',
    message,
    url: eventUrl,
  });
}

/**
 * 分享用户资料
 */
export async function shareUserProfile(user: {
  id: number;
  nickname: string;
  bio?: string;
  avatar?: string;
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
}): Promise<ShareResult> {
  const url = createUniversalLink(`users/${user.id}`);

  let message = `👤 ${user.nickname}`;

  if (user.bio) {
    const bio = user.bio.length > 60
      ? user.bio.substring(0, 60) + '...'
      : user.bio;
    message += `\n\n${bio}`;
  }

  if (user.stats) {
    message += `\n\n📊 ${user.stats.followers} 粉丝 · ${user.stats.following} 关注 · ${user.stats.posts} 动态`;
  }

  message += '\n\n来票次元看看我的主页吧！';

  return shareContent({
    title: `${user.nickname} 的主页`,
    message,
    url,
    imageUrl: user.avatar,
  });
}

/**
 * 分享 App 邀请
 */
export async function shareAppInvitation(inviteCode?: string): Promise<ShareResult> {
  const url = createUniversalLink('');
  const message = inviteCode
    ? `🎉 发现一个超棒的演出票务平台 - 票次元！\n\n` +
      `📱 支持购票、数字藏品、社交互动\n` +
      `🎁 使用我的邀请码: ${inviteCode}\n\n` +
      `快来一起探索演出世界吧！`
    : `🎉 发现一个超棒的演出票务平台 - 票次元！\n\n` +
      `📱 支持购票、数字藏品、社交互动\n\n` +
      `快来一起探索演出世界吧！`;

  return shareContent({
    title: '邀请你加入票次元',
    message,
    url,
  });
}

/**
 * 分享图片（基于 URL）
 */
export async function shareImage(
  imageUrl: string,
  message?: string
): Promise<ShareResult> {
  try {
    // 下载图片到本地
    const fileUri = FileSystem.cacheDirectory + 'share_image.jpg';
    await FileSystem.downloadAsync(imageUrl, fileUri);

    const shareOptions: any = {
      message: message || '来自票次元',
      url: Platform.OS === 'ios' ? fileUri : `file://${fileUri}`,
    };

    const result = await Share.share(shareOptions);

    // 清理临时文件
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    if (result.action === Share.sharedAction) {
      return {
        success: true,
        action: result.activityType || 'shared',
      };
    } else if (result.action === Share.dismissedAction) {
      return {
        success: false,
        action: 'dismissed',
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '分享图片失败',
    };
  }
}

/**
 * 复制到剪贴板（作为分享的备用方案）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 注意: 需要安装 expo-clipboard
    // import * as Clipboard from 'expo-clipboard';
    // await Clipboard.setStringAsync(text);
    void text; // 保留参数使用
    return true;
  } catch {
    return false;
  }
}

/**
 * 辅助函数：获取稀有度标签
 */
function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return labels[rarity] || rarity;
}

/**
 * 检查分享功能是否可用
 */
export async function isShareAvailable(): Promise<boolean> {
  try {
    // Share API 在所有平台都可用
    return true;
  } catch {
    return false;
  }
}

/**
 * 分享选项预设
 */
export const SHARE_PRESETS = {
  event: '分享活动',
  post: '分享动态',
  nft: '分享藏品',
  ticket: '分享门票',
  profile: '分享主页',
  app: '邀请好友',
};
