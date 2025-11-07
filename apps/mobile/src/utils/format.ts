/**
 * 格式化工具函数
 */

/**
 * 格式化价格
 * @param price 价格（单位：分）
 * @param showSymbol 是否显示货币符号
 * @returns 格式化后的价格字符串
 * @example formatPrice(12345) => '¥123.45'
 */
export function formatPrice(price: number, showSymbol: boolean = true): string {
  const yuan = (price / 100).toFixed(2);
  return showSymbol ? `¥${yuan}` : yuan;
}

/**
 * 格式化数字（添加千分位分隔符）
 * @param num 数字
 * @returns 格式化后的数字字符串
 * @example formatNumber(1234567) => '1,234,567'
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化手机号（隐藏中间 4 位）
 * @param phone 手机号
 * @returns 格式化后的手机号
 * @example formatPhone('13800138000') => '138****8000'
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 格式化邮箱（隐藏部分内容）
 * @param email 邮箱地址
 * @returns 格式化后的邮箱
 * @example formatEmail('example@example.com') => 'exa***@example.com'
 */
export function formatEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [username, domain] = email.split('@');
  if (username.length <= 3) {
    return `${username}***@${domain}`;
  }
  return `${username.slice(0, 3)}***@${domain}`;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 * @example formatFileSize(1024) => '1 KB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀（默认：'...'）
 * @returns 截断后的文本
 * @example truncateText('这是一段很长的文本', 5) => '这是一段...'
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + suffix;
}

/**
 * 格式化距离
 * @param meters 距离（单位：米）
 * @returns 格式化后的距离
 * @example formatDistance(1500) => '1.5 km'
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * 格式化倒计时
 * @param seconds 秒数
 * @returns 格式化后的倒计时
 * @example formatCountdown(3665) => '01:01:05'
 */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}
