import Taro from '@tarojs/taro';
import { apiClient } from './api';
import { setToken, setRefreshToken, setUser, clearAll, getUser, StoredUser } from './storage';

/**
 * 微信小程序登录流程：
 * 1. 调 Taro.login() 拿到 code（5 分钟内有效）
 * 2. POST 到 /api/auth/wechat-login，后端调 jscode2session 拿 openid
 * 3. 后端查找/创建用户 + 返回 JWT 双 token
 * 4. 客户端存 token + user
 */
export async function loginWithWechat(): Promise<{ ok: boolean; error?: string; user?: StoredUser }> {
  try {
    const { code } = await Taro.login();
    if (!code) {
      return { ok: false, error: '获取微信登录 code 失败' };
    }

    const res = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      token: string;
      user: StoredUser;
    }>('/api/auth/wechat-login', { code }, { skipAuth: true });

    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || '登录失败' };
    }

    setToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setUser(res.data.user);
    return { ok: true, user: res.data.user };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '微信登录异常';
    return { ok: false, error: msg };
  }
}

export function getCurrentUser(): StoredUser | null {
  return getUser();
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function logout() {
  clearAll();
  Taro.reLaunch({ url: '/pages/login/index' });
}
