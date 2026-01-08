// 应用配置
export const APP_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.14:3000',
  APP_NAME: '票次元',
  VERSION: '1.0.0',
};

// 主题颜色 - 与网站 globals.css 统一
export const COLORS = {
  // 主色调
  primary: '#EAF353',              // 票次元黄色（主色）
  secondary: '#C72471',            // 玫红色（强调色）
  accent: '#C72471',               // 强调色（用于标题、项目名称）

  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // 背景色
  background: '#ffffff',           // 页面背景（白色，适合移动端）
  backgroundAccent: '#C72471',     // 强调背景（玫红色，用于头部/特殊区域）
  surface: '#f8f8f8',              // 卡片背景（浅灰）
  surfaceElevated: '#ffffff',      // 抬起的卡片背景（纯白）

  // 文字色
  text: '#282828',                 // 主文字（与网站统一）
  textSecondary: 'rgba(40, 40, 40, 0.6)',  // 次要文字
  textOnPrimary: '#1a1a1f',        // 在 primary 色上的文字
  textLight: '#ffffff',            // 在深色背景上的文字

  // 边框色
  border: '#FFEBF5',               // 默认边框（粉色）
  borderHover: '#FFE3F0',          // hover 边框
  borderSubtle: 'rgba(255, 235, 245, 0.5)',  // 淡边框
  borderPrimary: 'rgba(234, 243, 83, 0.3)',  // 黄色边框
};

// 渐变色配置（单独导出，避免与 COLORS 混淆）
export const GRADIENTS = {
  primary: ['#EAF353', '#C72471'],        // 黄到玫红
  secondary: ['#C72471', '#FFE3F0'],      // 玫红到粉
  accent: ['#EAF353', '#D5E340'],         // 黄色渐变（与网站 gradient-text 一致）
  card: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],  // 卡片渐变
};

// 小写版本（推荐使用）
export const colors = COLORS;

// 间距
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 小写版本（推荐使用）
export const spacing = SPACING;

// 字体大小
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// 小写版本（推荐使用）
export const fontSize = FONT_SIZES;

// 圆角半径 - 与网站 cards.css 统一
export const BORDER_RADIUS = {
  xs: 4,              // 超小
  sm: 8,              // 小 (--card-radius-sm)
  md: 12,             // 中 (--card-radius-md)
  lg: 16,             // 大 (--card-radius-lg)
  xl: 24,             // 超大 (--card-radius-xl)
  full: 9999,         // 圆形
};

// 兼容旧代码
export const { md: medium } = BORDER_RADIUS;

// 小写版本（推荐使用）
export const borderRadius = BORDER_RADIUS;
