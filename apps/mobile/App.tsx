import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import PrivacyConsent from './src/components/PrivacyConsent';
import { ToastProvider } from './src/components/Toast';

const CONSENT_KEY = 'privacy_consent_accepted';

// 阻止 native splash 自动消失，等 React + auth init 完成后由我们手动 hide
// （否则会出现 native splash → 白屏 / spinner → React UI 的闪烁）
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const consent = await AsyncStorage.getItem(CONSENT_KEY);
        setHasConsented(!!consent);
      } catch {
        setHasConsented(false);
      }
    })();
  }, []);

  // 未拿到 consent 状态时 splash 持续显示，不渲染任何东西
  if (hasConsented === null) {
    return null;
  }

  // 未同意隐私 — 显示隐私同意页（splash 立刻 hide，让用户看到 PrivacyConsent）
  if (!hasConsented) {
    SplashScreen.hideAsync().catch(() => {});
    return <PrivacyConsent onConsent={() => setHasConsented(true)} />;
  }

  // 已同意 — 进入完整 app 树。SplashScreen.hideAsync 在 AppContent 等
  // auth init 完成后才调用（避免 splash → spinner → UI 三段闪烁）。
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <AppContent />
              <StatusBar style="auto" />
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

/**
 * 内部组件 — 在 AuthProvider 树内能用 useAuth()，可以等 isLoading=false 后
 * 再 hide splash。这样 native splash 平滑过渡到第一帧 UI（无 spinner 闪烁）。
 */
function AppContent() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  return <AppNavigator />;
}
