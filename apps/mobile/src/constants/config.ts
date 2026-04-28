// 应用配置
export const APP_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://piaociyuan.com',
  APP_NAME: '票次元',
  VERSION: '1.0.0',
};

// 主题颜色 - 与网站 globals.css 统一
export const COLORS = {
  // 主色调
  primary: '#46467A',              // 票次元紫色（主色）
  secondary: '#5A5A8E',            // 次紫色（略浅，用于导航栏渐变）
  accent: '#46467A',               // 强调色（用于标题、项目名称）
  priceCTA: '#FF4D6A',             // 暖色CTA（购票按钮、价格文字）

  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // 背景色
  background: '#E0DFFD',           // 页面背景（淡紫色，与网站统一）
  backgroundAccent: '#46467A',     // 强调背景（紫色，用于头部/底部导航）
  backgroundDark: '#2D2D5E',       // 深色背景
  surface: '#ffffff',              // 卡片背景（白色，与网站统一）
  surfaceElevated: '#ffffff',      // 抬起的卡片背景（纯白）
  surfaceGlass: 'rgba(255, 255, 255, 0.8)',  // 毛玻璃白卡（与网站 .card-bg 统一）
  surfaceGlassTint: 'rgba(224, 223, 253, 0.5)', // 半透明淡紫（搜索框等输入区）

  // 文字色
  text: '#1a1a1f',                 // 主文字（与网站 --foreground 统一）
  textSecondary: 'rgba(26, 26, 31, 0.6)',  // 次要文字
  textOnPrimary: '#ffffff',        // 在 primary 色上的文字（白色）
  textLight: '#ffffff',            // 在深色背景上的文字

  // 边框色 - 与网站 cards.css 统一
  border: '#FFEBF5',                       // 卡片边框（浅粉，与网站统一）
  borderHover: '#FFE3F0',                  // hover 边框
  borderSubtle: 'rgba(255, 235, 245, 0.5)', // 淡边框
  borderPrimary: 'rgba(70, 70, 122, 0.3)', // 主色边框
};

// 渐变色配置（单独导出，避免与 COLORS 混淆）
// 使用 as const 把每个数组定为 readonly tuple，满足 expo-linear-gradient 的 colors 类型要求
export const GRADIENTS = {
  primary: ['#46467A', '#E0DFFD'],        // 紫色到淡紫
  secondary: ['#46467A', '#7A7AAE'],      // 紫色渐变
  accent: ['#46467A', '#5A5A8E'],         // 紫色渐变（与网站统一）
  header: ['#3D3D6E', '#5A5A8E'],         // Header 渐变（深紫到浅紫）
  cta: ['#FF4D6A', '#FF6B8A'],            // CTA 按钮渐变（暖红）
  card: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],  // 卡片渐变
  imageOverlay: ['transparent', 'rgba(0,0,0,0.6)'],  // 图片底部遮罩
} as const;

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
// 同时提供 small/medium/large 别名，兼容历史代码
export const BORDER_RADIUS = {
  xs: 4,              // 超小
  sm: 8,              // 小 (--card-radius-sm)
  md: 12,             // 中 (--card-radius-md)
  lg: 16,             // 大 (--card-radius-lg)
  xl: 24,             // 超大 (--card-radius-xl)
  full: 9999,         // 圆形
  // 别名（不要再新增使用，沿用即可）
  small: 8,
  medium: 12,
  large: 16,
};

// 顶层 medium 兼容（旧代码直接 import { medium }）
export const medium = BORDER_RADIUS.medium;

// 小写版本（推荐使用）
export const borderRadius = BORDER_RADIUS;

// 阴影系统 - 与网站 cards.css 统一
export const SHADOWS = {
  sm: {
    shadowColor: '#46467A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#46467A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#46467A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const shadows = SHADOWS;
