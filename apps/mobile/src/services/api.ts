import { APP_CONFIG } from '../constants/config';
import type { ApiResponse } from '@piaoyuzhou/shared';
import { handleApiError } from '../utils/error';
import * as StorageService from './storage';

interface RequestOptions extends RequestInit {
  retry?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * API 客户端基础配置（增强版）
 *
 * 功能：
 * - 自动 Token 刷新
 * - 请求重试
 * - 请求缓存
 * - 请求取消
 * - 统一错误处理
 */
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  // 请求缓存
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultCacheTime: number = 5 * 60 * 1000; // 5 分钟

  // 请求取消控制器（使用唯一 ID，避免并发请求覆盖）
  private abortControllers: Map<string, AbortController> = new Map();
  private requestIdCounter: number = 0;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 生成唯一请求 ID
   */
  private generateRequestId(endpoint: string): string {
    return `${endpoint}:${++this.requestIdCounter}`;
  }

  /**
   * 设置访问令牌
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * 设置刷新令牌
   */
  setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  /**
   * 初始化 Token（从存储中加载）
   */
  async initializeTokens() {
    try {
      const accessToken = await StorageService.getAccessToken();
      const refreshToken = await StorageService.getRefreshToken();
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);
    } catch {
      // Token 初始化失败，静默处理（用户可能未登录）
    }
  }

  /**
   * 获取请求头
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * 刷新 Token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Failed to refresh token');
      }

      const newAccessToken = data.data.accessToken;
      this.setAccessToken(newAccessToken);
      await StorageService.saveAccessToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      // Token 刷新失败，清除所有 Token
      this.setAccessToken(null);
      this.setRefreshToken(null);
      await StorageService.clearTokens();
      throw error;
    }
  }

  /**
   * 处理 Token 刷新队列
   */
  private processQueue(error: any = null, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * 获取缓存
   */
  private getCacheValue<T>(key: string, cacheTime: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > cacheTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  private setCacheValue<T>(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * 取消请求
   */
  cancelRequest(endpoint: string) {
    const controller = this.abortControllers.get(endpoint);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(endpoint);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * 通用请求方法（增强版）
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      retry = 3,
      retryDelay = 1000,
      cache = false,
      cacheTime = this.defaultCacheTime,
      ...fetchOptions
    } = options;

    // 检查缓存
    if (cache && fetchOptions.method === 'GET') {
      const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions.body || {})}`;
      const cachedValue = this.getCacheValue<ApiResponse<T>>(cacheKey, cacheTime);
      if (cachedValue) {
        return cachedValue;
      }
    }

    // 创建 AbortController（使用唯一 ID 避免并发覆盖）
    const requestId = this.generateRequestId(endpoint);
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    let lastError: any;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...fetchOptions,
          headers: {
            ...this.getHeaders(),
            ...fetchOptions.headers,
          },
          signal: controller.signal,
        });

        // 处理 401 未授权错误（Token 过期）
        if (response.status === 401 && this.refreshToken) {
          // 如果正在刷新，将请求加入队列
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              // Token 刷新后重试请求
              return this.request<T>(endpoint, options);
            });
          }

          this.isRefreshing = true;

          try {
            await this.refreshAccessToken();
            this.processQueue(null, this.accessToken);
            this.isRefreshing = false;

            // 使用新 Token 重试请求
            return this.request<T>(endpoint, options);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.isRefreshing = false;
            // 抛出特殊的认证错误
            throw {
              response: {
                status: 401,
                data: {
                  ok: false,
                  code: 'TOKEN_EXPIRED',
                  error: '登录已过期，请重新登录',
                },
              },
            };
          }
        }

        const data = await response.json();

        if (!response.ok) {
          throw {
            response: {
              status: response.status,
              data,
            },
          };
        }

        // 设置缓存
        if (cache && fetchOptions.method === 'GET') {
          const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions.body || {})}`;
          this.setCacheValue(cacheKey, data);
        }

        // 清理 AbortController
        this.abortControllers.delete(requestId);

        return data;
      } catch (error: any) {
        lastError = error;

        // 如果是取消请求，直接抛出错误
        if (error.name === 'AbortError') {
          throw new Error('请求已取消');
        }

        // 如果是最后一次重试，抛出错误
        if (attempt === retry) {
          break;
        }

        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    // 清理 AbortController
    this.abortControllers.delete(requestId);

    // 处理错误
    const errorMessage = handleApiError(lastError);
    throw new Error(errorMessage);
  }

  /**
   * GET 请求
   */
  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT 请求
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// 导出单例
export const apiClient = new ApiClient(APP_CONFIG.API_URL);

// 导出类型
export type { RequestOptions };
