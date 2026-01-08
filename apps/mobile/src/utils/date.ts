/**
 * 日期时间工具函数
 */

/**
 * 格式化日期
 * @param date 日期字符串或 Date 对象
 * @param format 格式 (默认: 'YYYY-MM-DD')
 * @returns 格式化后的日期字符串
 * @example formatDate('2025-11-05') => '2025年11月05日'
 */
export function formatDate(
  date: string | Date,
  format: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'MM-DD' | 'YYYY年MM月DD日' = 'YYYY-MM-DD'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '-';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM-DD':
      return `${month}-${day}`;
    case 'YYYY年MM月DD日':
      return `${year}年${month}月${day}日`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 格式化时间
 * @param date 日期字符串或 Date 对象
 * @param format 格式 (默认: 'HH:mm')
 * @returns 格式化后的时间字符串
 * @example formatTime('2025-11-05 14:30:00') => '14:30'
 */
export function formatTime(
  date: string | Date,
  format: 'HH:mm' | 'HH:mm:ss' = 'HH:mm'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '-';
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (format === 'HH:mm:ss') {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间
 * @param date 日期字符串或 Date 对象
 * @param format 格式 (默认: 'YYYY-MM-DD HH:mm')
 * @returns 格式化后的日期时间字符串
 * @example formatDateTime('2025-11-05T14:30:00') => '2025-11-05 14:30'
 */
export function formatDateTime(
  date: string | Date,
  format: 'YYYY-MM-DD HH:mm' | 'YYYY年MM月DD日 HH:mm' = 'YYYY-MM-DD HH:mm'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '-';
  }

  const dateStr = formatDate(d, format.startsWith('YYYY年') ? 'YYYY年MM月DD日' : 'YYYY-MM-DD');
  const timeStr = formatTime(d, 'HH:mm');

  return `${dateStr} ${timeStr}`;
}

/**
 * 获取相对时间
 * @param date 日期字符串或 Date 对象
 * @returns 相对时间描述
 * @example getRelativeTime('2025-11-05 14:30:00') => '刚刚' | '5分钟前' | '2小时前' | '昨天' | '3天前'
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 0) {
    return formatDateTime(d);
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return formatDate(d, 'YYYY-MM-DD');
  }
}

/**
 * 判断日期是否为今天
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * 判断日期是否为昨天
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/**
 * 获取星期几
 */
export function getWeekday(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[d.getDay()];
}

/**
 * 获取消息显示时间字符串
 * @param date 日期对象
 * @returns 时间字符串
 */
export function getTimeString(date: Date): string {
  if (isNaN(date.getTime())) {
    return '';
  }

  if (isToday(date)) {
    return formatTime(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return `昨天 ${formatTime(date, 'HH:mm')}`;
  } else {
    return formatDateTime(date, 'YYYY-MM-DD HH:mm');
  }
}
