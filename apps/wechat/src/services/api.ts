import Taro from '@tarojs/taro';
import { getToken, getRefreshToken, setToken, setRefreshToken, clearAll } from './storage';

/**
 * Taro 端 API client — 包装 Taro.request
 * 接口签名对齐 apps/mobile/src/services/api.ts 便于复用上层 service 代码
 */

const API_URL = (process.env.TARO_APP_API_URL as string) || 'https://piaociyuan.com';

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}

function buildUrl(endpoint: string, params?: RequestOptions['params']): string {
  const base = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  if (!params) return base;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await Taro.request({
      url: `${API_URL}/api/auth/refresh`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { refreshToken },
    });
    const body = res.data as { ok?: boolean; data?: { accessToken?: string; refreshToken?: string } };
    if (res.statusCode === 200 && body.ok && body.data?.accessToken) {
      setToken(body.data.accessToken);
      if (body.data.refreshToken) setRefreshToken(body.data.refreshToken);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function coreRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint, options?.params);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (!options?.skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await Taro.request({
      url,
      method,
      header: headers,
      data: body,
    });

    // 401：尝试 refresh 一次，成功则重试
    if (res.statusCode === 401 && !options?.skipAuth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getToken();
        if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
        const retry = await Taro.request({
          url,
          method,
          header: headers,
          data: body,
        });
        return parseResponse<T>(retry);
      }
      // refresh 失败：清 storage 跳 login
      clearAll();
      Taro.reLaunch({ url: '/pages/login/index' });
      return { ok: false, error: '登录已过期，请重新登录', status: 401 };
    }

    return parseResponse<T>(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '网络错误';
    return { ok: false, error: msg };
  }
}

function parseResponse<T>(res: Taro.request.SuccessCallbackResult<unknown>): ApiResponse<T> {
  const body = res.data as { ok?: boolean; data?: T; error?: string; message?: string } | T;
  if (res.statusCode >= 200 && res.statusCode < 300) {
    // 后端通常返回 { ok: true, data: ... }；如果是裸数据也兼容
    if (body && typeof body === 'object' && 'ok' in body) {
      return {
        ok: !!(body as { ok?: boolean }).ok,
        data: (body as { data?: T }).data,
        error: (body as { error?: string }).error,
        message: (body as { message?: string }).message,
        status: res.statusCode,
      };
    }
    return { ok: true, data: body as T, status: res.statusCode };
  }
  const errBody = body as { error?: string; message?: string };
  return {
    ok: false,
    error: errBody?.error || errBody?.message || `HTTP ${res.statusCode}`,
    status: res.statusCode,
  };
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    coreRequest<T>(endpoint, 'GET', undefined, options),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    coreRequest<T>(endpoint, 'POST', body, options),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    coreRequest<T>(endpoint, 'PUT', body, options),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    coreRequest<T>(endpoint, 'PATCH', body, options),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    coreRequest<T>(endpoint, 'DELETE', undefined, options),
};
