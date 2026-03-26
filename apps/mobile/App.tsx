import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import PrivacyConsent from './src/components/PrivacyConsent';

const CONSENT_KEY = 'privacy_consent_accepted';

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

  const handleConsent = () => {
    setHasConsented(true);
  };

  // Still loading consent status
  if (hasConsented === null) {
    return null;
  }

  // User has not consented - show only the privacy consent screen
  if (!hasConsented) {
    return <PrivacyConsent onConsent={handleConsent} />;
  }

  // User has consented - render the full app
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
