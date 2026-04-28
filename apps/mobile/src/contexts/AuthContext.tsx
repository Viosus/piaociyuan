import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
} from '../services/auth';
import {
  saveAccessToken,
  saveRefreshToken,
  saveUser,
  getAccessToken,
  getUser,
  clearAuth,
} from '../services/storage';
import type { UserAuthSummary } from '@piaoyuzhou/shared';

// AuthContext 持有的 User 形状：登录最小集（UserAuthSummary）+ 个人资料编辑用得到的字段。
// 启动时由 getCurrentUser() 拉取的完整资料填充。
interface User extends UserAuthSummary {
  avatar?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  coverImage?: string | null;
  isVerified?: boolean;
  verifiedType?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (phone: string, password: string, verificationCode: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** 重新从服务端拉取当前用户的最新资料；EditProfileScreen 保存后调用。 */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查是否已登录
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 初始化 API client 的 tokens（包括 accessToken 和 refreshToken）
      await apiClient.initializeTokens();

      const savedUser = await getUser();
      if (savedUser) {
        setUser(savedUser);

        // 启动时刷新最新资料（不阻塞 UI）
        refreshUserSilent();
      }
    } catch (error) {
      console.warn('认证初始化失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /** 后台静默刷新用户资料；失败不抛错，避免影响登录态。 */
  const refreshUserSilent = async () => {
    try {
      const resp = await getCurrentUser();
      if (resp.ok && resp.data) {
        const fresh: User = {
          id: resp.data.id,
          phone: resp.data.phone,
          email: resp.data.email,
          nickname: resp.data.nickname,
          role: resp.data.role,
          avatar: resp.data.avatar,
          bio: resp.data.bio,
          website: resp.data.website,
          location: resp.data.location,
          coverImage: resp.data.coverImage,
          isVerified: resp.data.isVerified,
          verifiedType: resp.data.verifiedType,
        };
        setUser(fresh);
        await saveUser(fresh);
      }
    } catch (err) {
      console.warn('[AuthContext] 刷新用户资料失败:', (err as Error)?.message);
    }
  };

  /** 公开方法：组件可主动调用（如 EditProfileScreen 保存后）。 */
  const refreshUser = async () => {
    await refreshUserSilent();
  };

  const login = async (phone: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiLogin({ phone, password, rememberMe });

      if (response.ok && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;

        await saveAccessToken(accessToken);
        await saveRefreshToken(refreshToken);
        await saveUser(userData);

        apiClient.setAccessToken(accessToken);
        apiClient.setRefreshToken(refreshToken);
        setUser(userData);
      } else {
        throw new Error(response.error || '登录失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    phone: string,
    password: string,
    verificationCode: string,
    nickname?: string
  ) => {
    try {
      const response = await apiRegister({
        phone,
        password,
        verificationCode,
        nickname,
      });

      if (response.ok && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;

        await saveAccessToken(accessToken);
        await saveRefreshToken(refreshToken);
        await saveUser(userData);

        apiClient.setAccessToken(accessToken);
        apiClient.setRefreshToken(refreshToken);
        setUser(userData);
      } else {
        throw new Error(response.error || '注册失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      await clearAuth();
      apiClient.setAccessToken(null);
      apiClient.setRefreshToken(null);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
