// 共享常量定义

/**
 * API 错误代码
 */
export const ErrorCode = {
  // 认证相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 业务逻辑
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_INPUT: 'INVALID_INPUT',

  // 票务相关
  TICKET_SOLD_OUT: 'TICKET_SOLD_OUT',
  TICKET_ALREADY_USED: 'TICKET_ALREADY_USED',
  HOLD_EXPIRED: 'HOLD_EXPIRED',

  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * JWT 相关常量
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

/**
 * 票据锁定时间（毫秒）
 */
export const TICKET_HOLD_DURATION = 5 * 60 * 1000; // 5分钟

/**
 * 分页默认配置
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * NFT 铸造状态
 */
export const NFT_MINT_STATUS = {
  PENDING: 'pending',
  MINTING: 'minting',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

/**
 * 文件上传限制
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;
