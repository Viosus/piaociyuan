import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/auth';
import {
  saveAccessToken,
  saveRefreshToken,
  saveUser,
  getAccessToken,
  getUser,
  clearAuth,
} from '../services/storage';

interface User {
  id: number;
  phone?: string;
  email?: string;
  nickname?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, verificationCode: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
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
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await apiLogin({ phone, password });

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
      console.error('登录失败:', error);
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
      console.error('注册失败:', error);
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
      console.error('退出登录失败:', error);
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
