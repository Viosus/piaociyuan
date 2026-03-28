// lib/time.ts - 北京时间格式化工具

const TIMEZONE = 'Asia/Shanghai';

/**
 * 相对时间（刚刚/x分钟前/x小时前/x天前）
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 365) {
    return date.toLocaleDateString('zh-CN', {
      timeZone: TIMEZONE,
      month: '2-digit',
      day: '2-digit',
    });
  }
  return date.toLocaleDateString('zh-CN', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 完整日期时间（yyyy-MM-dd HH:mm）
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 消息时间（今天显示 HH:mm，昨天显示 昨天 HH:mm，更早显示 MM-DD HH:mm）
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // 使用北京时间计算日期差
  const dateStr = date.toLocaleDateString('zh-CN', { timeZone: TIMEZONE });
  const nowStr = now.toLocaleDateString('zh-CN', { timeZone: TIMEZONE });

  const timeStr = date.toLocaleTimeString('zh-CN', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (dateStr === nowStr) {
    return timeStr;
  }

  // 计算昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('zh-CN', { timeZone: TIMEZONE });

  if (dateStr === yesterdayStr) {
    return `昨天 ${timeStr}`;
  }

  // 今年内
  const dateYear = date.toLocaleDateString('zh-CN', { timeZone: TIMEZONE, year: 'numeric' });
  const nowYear = now.toLocaleDateString('zh-CN', { timeZone: TIMEZONE, year: 'numeric' });

  if (dateYear === nowYear) {
    return date.toLocaleString('zh-CN', {
      timeZone: TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return formatDateTime(dateString);
}

/**
 * 判断两条消息之间是否需要显示时间分隔（间隔超过5分钟）
 */
export function shouldShowTimeDivider(prevDateString: string, currDateString: string): boolean {
  const prev = new Date(prevDateString);
  const curr = new Date(currDateString);
  return curr.getTime() - prev.getTime() > 5 * 60 * 1000;
}
