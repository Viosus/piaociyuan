// 应用配置
export const APP_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  APP_NAME: '票次元',
  VERSION: '1.0.0',
};

// 主题颜色
export const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff',
  surface: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
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

// 圆角半径
export const BORDER_RADIUS = {
  sm: 4,
  medium: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// 小写版本（推荐使用）
export const borderRadius = BORDER_RADIUS;
