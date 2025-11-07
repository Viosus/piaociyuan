/**
 * 活动状态工具函数
 */

// 售票状态
export type SaleStatus = 'not_started' | 'on_sale' | 'paused' | 'sold_out' | 'ended';

// 活动进行状态
export type EventStatus = 'upcoming' | 'ongoing' | 'ended';

export type EventCategory = 'concert' | 'festival' | 'exhibition' | 'musicale' | 'show' | 'sports' | 'other';

/**
 * 活动类型标签映射
 */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  concert: '演唱会',
  festival: '音乐节',
  exhibition: '展览',
  musicale: '音乐会',
  show: '演出',
  sports: '体育赛事',
  other: '其他',
};

/**
 * 活动类型图标映射
 */
export const EVENT_CATEGORY_ICONS: Record<EventCategory, string> = {
  concert: '🎤',
  festival: '🎪',
  exhibition: '🎨',
  musicale: '🎻',
  show: '🎭',
  sports: '⚽',
  other: '📅',
};

/**
 * 活动类型颜色映射
 */
export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  concert: 'bg-purple-100 text-purple-800',
  festival: 'bg-pink-100 text-pink-800',
  exhibition: 'bg-blue-100 text-blue-800',
  musicale: 'bg-indigo-100 text-indigo-800',
  show: 'bg-amber-100 text-amber-800',
  sports: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

// 售票状态标签映射
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  not_started: '未开售',
  on_sale: '售票中',
  paused: '暂停售票',
  sold_out: '已售罄',
  ended: '已结束',
};

export const SALE_STATUS_COLORS: Record<SaleStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  on_sale: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  sold_out: 'bg-red-100 text-red-700',
  ended: 'bg-gray-100 text-gray-500',
};

export interface EventStatusInfo {
  status: EventStatus;
  label: string;
  canPurchase: boolean;
  color: string;
}

export interface SaleStatusInfo {
  saleStatus: SaleStatus;
  label: string;
  canPurchase: boolean;
  color: string;
  reason?: string;  // 不能购票的原因
}

/**
 * 获取售票状态信息（新版 - 基于数据库字段）
 * @param saleStatus 数据库中的售票状态
 * @param saleStartTime 开售时间
 * @param saleEndTime 停售时间
 * @param remaining 剩余票数（可选，用于判断sold_out）
 * @returns 售票状态信息
 */
export function getSaleStatusInfo(
  saleStatus: string,
  saleStartTime: Date | string,
  saleEndTime: Date | string,
  remaining?: number
): SaleStatusInfo {
  const now = new Date();
  const startTime = typeof saleStartTime === 'string' ? new Date(saleStartTime) : saleStartTime;
  const endTime = typeof saleEndTime === 'string' ? new Date(saleEndTime) : saleEndTime;

  // 1. 检查管理员手动设置的状态
  if (saleStatus === 'paused') {
    return {
      saleStatus: 'paused',
      label: SALE_STATUS_LABELS.paused,
      canPurchase: false,
      color: SALE_STATUS_COLORS.paused,
      reason: '活动暂停售票',
    };
  }

  if (saleStatus === 'sold_out') {
    return {
      saleStatus: 'sold_out',
      label: SALE_STATUS_LABELS.sold_out,
      canPurchase: false,
      color: SALE_STATUS_COLORS.sold_out,
      reason: '门票已售罄',
    };
  }

  if (saleStatus === 'ended') {
    return {
      saleStatus: 'ended',
      label: SALE_STATUS_LABELS.ended,
      canPurchase: false,
      color: SALE_STATUS_COLORS.ended,
      reason: '活动已结束',
    };
  }

  // 2. 检查剩余票数
  if (remaining !== undefined && remaining === 0) {
    return {
      saleStatus: 'sold_out',
      label: SALE_STATUS_LABELS.sold_out,
      canPurchase: false,
      color: SALE_STATUS_COLORS.sold_out,
      reason: '门票已售罄',
    };
  }

  // 3. 检查时间范围
  if (now < startTime) {
    return {
      saleStatus: 'not_started',
      label: SALE_STATUS_LABELS.not_started,
      canPurchase: false,
      color: SALE_STATUS_COLORS.not_started,
      reason: `售票将于 ${formatDateTime(startTime)} 开始`,
    };
  }

  if (now > endTime) {
    return {
      saleStatus: 'ended',
      label: SALE_STATUS_LABELS.ended,
      canPurchase: false,
      color: SALE_STATUS_COLORS.ended,
      reason: '售票已结束',
    };
  }

  // 4. 正在售票中
  return {
    saleStatus: 'on_sale',
    label: SALE_STATUS_LABELS.on_sale,
    canPurchase: true,
    color: SALE_STATUS_COLORS.on_sale,
  };
}

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 判断活动是否已过期（旧版 - 保留用于兼容）
 * @param dateString 日期字符串，格式如 "2025-01-15"
 * @param timeString 时间字符串，格式如 "19:30"
 * @returns 活动状态信息
 */
export function getEventStatus(dateString: string, timeString: string): EventStatusInfo {
  try {
    // 解析活动日期和时间
    const eventDateTimeStr = `${dateString} ${timeString}`;
    const eventDateTime = new Date(eventDateTimeStr);

    // 如果解析失败，返回默认状态
    if (isNaN(eventDateTime.getTime())) {
      console.warn(`Invalid date format: ${dateString} ${timeString}`);
      return {
        status: 'upcoming',
        label: '即将开始',
        canPurchase: true,
        color: 'blue',
      };
    }

    const now = new Date();

    // 活动结束时间（假设活动持续3小时）
    const eventEndTime = new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000);

    if (now > eventEndTime) {
      // 活动已结束
      return {
        status: 'ended',
        label: '已结束',
        canPurchase: false,
        color: 'gray',
      };
    } else if (now >= eventDateTime && now <= eventEndTime) {
      // 活动进行中
      return {
        status: 'ongoing',
        label: '进行中',
        canPurchase: false,
        color: 'green',
      };
    } else {
      // 即将开始
      return {
        status: 'upcoming',
        label: '即将开始',
        canPurchase: true,
        color: 'blue',
      };
    }
  } catch (error) {
    console.error('Error parsing event date:', error);
    return {
      status: 'upcoming',
      label: '即将开始',
      canPurchase: true,
      color: 'blue',
    };
  }
}

/**
 * 判断活动是否可以购票
 * @param dateString 日期字符串
 * @param timeString 时间字符串
 * @returns 是否可以购票
 */
export function canPurchaseTickets(dateString: string, timeString: string): boolean {
  const statusInfo = getEventStatus(dateString, timeString);
  return statusInfo.canPurchase;
}

/**
 * 判断活动是否已结束
 * @param dateString 日期字符串
 * @param timeString 时间字符串
 * @returns 是否已结束
 */
export function isEventEnded(dateString: string, timeString: string): boolean {
  const statusInfo = getEventStatus(dateString, timeString);
  return statusInfo.status === 'ended';
}

/**
 * 格式化活动日期显示
 * @param dateString 日期字符串
 * @param timeString 时间字符串
 * @returns 格式化的日期时间字符串
 */
export function formatEventDateTime(dateString: string, timeString: string): string {
  try {
    const eventDateTime = new Date(`${dateString} ${timeString}`);
    if (isNaN(eventDateTime.getTime())) {
      return `${dateString} ${timeString}`;
    }

    const year = eventDateTime.getFullYear();
    const month = String(eventDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(eventDateTime.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[eventDateTime.getDay()];

    return `${year}年${month}月${day}日 ${weekday} ${timeString}`;
  } catch (error) {
    return `${dateString} ${timeString}`;
  }
}

/**
 * 获取活动倒计时信息
 * @param dateString 日期字符串
 * @param timeString 时间字符串
 * @returns 倒计时文本
 */
export function getEventCountdown(dateString: string, timeString: string): string | null {
  try {
    const eventDateTime = new Date(`${dateString} ${timeString}`);
    if (isNaN(eventDateTime.getTime())) {
      return null;
    }

    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();

    if (diff <= 0) {
      return null;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `距离开始还有 ${days} 天`;
    } else if (hours > 0) {
      return `距离开始还有 ${hours} 小时`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `距离开始还有 ${minutes} 分钟`;
    }
  } catch (error) {
    return null;
  }
}
