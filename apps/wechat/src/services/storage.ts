import Taro from '@tarojs/taro';

/**
 * 小程序本地存储封装 — 接口对齐 apps/mobile/src/services/storage.ts
 * 在小程序里走 Taro.setStorageSync（底层是 wx.setStorageSync）
 */

const KEY_ACCESS_TOKEN = 'access_token';
const KEY_REFRESH_TOKEN = 'refresh_token';
const KEY_USER = 'user';

export interface StoredUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  role?: string;
  wechatOpenId?: string | null;
}

export function getToken(): string | null {
  try {
    const v = Taro.getStorageSync(KEY_ACCESS_TOKEN);
    return v || null;
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  Taro.setStorageSync(KEY_ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | null {
  try {
    const v = Taro.getStorageSync(KEY_REFRESH_TOKEN);
    return v || null;
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string) {
  Taro.setStorageSync(KEY_REFRESH_TOKEN, token);
}

export function clearToken() {
  Taro.removeStorageSync(KEY_ACCESS_TOKEN);
  Taro.removeStorageSync(KEY_REFRESH_TOKEN);
}

export function getUser(): StoredUser | null {
  try {
    const v = Taro.getStorageSync(KEY_USER);
    if (!v) return null;
    return typeof v === 'string' ? JSON.parse(v) : (v as StoredUser);
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser) {
  Taro.setStorageSync(KEY_USER, user);
}

export function clearUser() {
  Taro.removeStorageSync(KEY_USER);
}

export function clearAll() {
  clearToken();
  clearUser();
}
