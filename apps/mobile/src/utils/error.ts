/**
 * 错误处理工具函数
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * 处理 API 错误
 * @param error 错误对象
 * @returns 格式化后的错误信息
 */
export function handleApiError(error: any): string {
  // 网络错误
  if (!error.response) {
    return '网络连接失败，请检查您的网络';
  }

  // HTTP 状态码错误
  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      return data?.message || '请求参数错误';
    case 401:
      return '未登录或登录已过期，请重新登录';
    case 403:
      return '没有权限访问';
    case 404:
      return '请求的资源不存在';
    case 500:
      return '服务器错误，请稍后重试';
    case 502:
    case 503:
    case 504:
      return '服务暂时不可用，请稍后重试';
    default:
      return data?.message || '操作失败，请稍后重试';
  }
}

/**
 * 格式化错误消息（用于显示给用户）
 * @param error 错误对象或字符串
 * @returns 用户友好的错误消息
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  return '操作失败，请稍后重试';
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return !error.response && error.message === 'Network request failed';
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * 判断是否为权限错误
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403;
}

/**
 * 创建错误对象
 */
export function createError(
  message: string,
  code?: string,
  status?: number
): ApiError {
  return { message, code, status };
}
