import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * 用户认证相关的 API
 */

interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    phone?: string;
    email?: string;
    nickname?: string;
    role: string;
  };
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
  // 后端API期望 account 字段（可以是手机号或邮箱）
  const { phone, email, password } = data;
  const account = phone || email;

  return apiClient.post<LoginResponse>('/api/auth/login', {
    account,
    password,
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
 * 退出登录
 */
export async function logout(): Promise<void> {
  apiClient.setAccessToken(null);
}
