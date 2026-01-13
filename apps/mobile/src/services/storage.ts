import * as SecureStore from 'expo-secure-store';

/**
 * 安全存储服务
 */

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};

/**
 * 保存访问令牌
 */
export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

/**
 * 获取访问令牌
 */
export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

/**
 * 保存刷新令牌
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

/**
 * 获取刷新令牌
 */
export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

/**
 * 保存用户信息
 */
export async function saveUser(user: any): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
}

/**
 * 获取用户信息
 */
export async function getUser(): Promise<any | null> {
  const userData = await SecureStore.getItemAsync(KEYS.USER);
  return userData ? JSON.parse(userData) : null;
}

/**
 * 清除所有认证信息
 */
export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.USER);
}

// 别名，兼容 API 客户端调用
export const clearTokens = clearAuth;
