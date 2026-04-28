import { apiClient } from './api';
import { getRefreshToken, clearAuth } from './storage';
import type { ApiResponse, User, UserAuthSummary } from '@piaoyuzhou/shared';

/**
 * 用户认证相关的 API
 */

interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserAuthSummary;
}

interface RegisterRequest {
  phone?: string;
  email?: string;
  password: string;
  nickname?: string;
  verificationCode: string;
}

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const { phone, email, password, rememberMe = false } = data;
  const account = phone || email;

  return apiClient.post<LoginResponse>('/api/auth/login', {
    account,
    password,
    rememberMe,
  });
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  return apiClient.post<LoginResponse>('/api/auth/register', data);
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(
  phone?: string,
  email?: string
): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/api/auth/send-code', { phone, email });
}

/**
 * 刷新 Token
 */
export async function refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
  return apiClient.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken });
}

/**
 * 获取当前登录用户的最新资料
 * AuthContext 在 app 启动时（如果有有效 token）应调用一次，
 * 避免使用过期的登录响应数据。
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiClient.get<User>('/api/user/me');
}

/**
 * 退出登录
 *
 * 先调服务端撤销 refresh token（防止账号被盗后旧设备仍能用），
 * 再清前端 token。即使服务端调用失败也强制清前端，保证用户体验。
 */
export async function logout(): Promise<void> {
  try {
    const rt = await getRefreshToken();
    if (rt) {
      await apiClient.post('/api/auth/logout', { refreshToken: rt }).catch((err) => {
        console.warn('[auth] server logout failed, clearing local anyway:', err);
      });
    }
  } finally {
    apiClient.setAccessToken(null);
    await clearAuth().catch(() => {});
  }
}
