import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import PrivacyConsent from './src/components/PrivacyConsent';
import { ToastProvider } from './src/components/Toast';

const CONSENT_KEY = 'privacy_consent_accepted';

// 阻止 native splash 自动消失，等 React 第一次 render 时由我们手动 hide
// （否则会出现 native splash → 白屏 → React UI 的闪烁）
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore — preventAutoHideAsync 在已经 hide 后调用会 throw，无害
});

export default function App() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    checkInitialConsent();
  }, []);

  const checkInitialConsent = async () => {
    try {
      const consent = await AsyncStorage.getItem(CONSENT_KEY);
      setHasConsented(!!consent);
    } catch {
      setHasConsented(false);
    }
  };

  // 一旦 init 完（无论 consent 拿到 true / false），关闭 splash
  useEffect(() => {
    if (hasConsented !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hasConsented]);

  const handleConsent = () => {
    setHasConsented(true);
  };

  // Still loading consent status — splash 仍在显示，不渲染任何东西
  if (hasConsented === null) {
    return null;
  }

  // User has not consented - show only the privacy consent screen
  if (!hasConsented) {
    return <PrivacyConsent onConsent={handleConsent} />;
  }

  // User has consented - render the full app
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
