import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  Platform,
  BackHandler,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { APP_CONFIG } from '../constants/config';

const CONSENT_KEY = 'privacy_consent_accepted';

interface PrivacyConsentProps {
  onConsent: () => void;
}

export default function PrivacyConsent({ onConsent }: PrivacyConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    try {
      const consent = await AsyncStorage.getItem(CONSENT_KEY);
      if (consent) {
        onConsent();
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, new Date().toISOString());
      setVisible(false);
      onConsent();
    } catch {
      // Even if storage fails, let user proceed
      setVisible(false);
      onConsent();
    }
  };

  const handleDisagree = () => {
    Alert.alert(
      '提示',
      '您需要同意隐私政策和用户协议才能使用票次元',
      Platform.OS === 'android'
        ? [
            { text: '退出应用', style: 'destructive', onPress: () => BackHandler.exitApp() },
            { text: '返回', style: 'cancel' },
          ]
        : [
            { text: '我知道了', style: 'cancel' },
          ],
    );
  };

  const openPrivacy = () => {
    Linking.openURL(`${APP_CONFIG.API_URL}/privacy`);
  };

  const openTerms = () => {
    Linking.openURL(`${APP_CONFIG.API_URL}/terms`);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent dismissing with Android back button
        handleDisagree();
      }}
    >
      <View style={styles.fullScreen}>
        <View style={styles.container}>
          <Text style={styles.title}>用户协议与隐私政策</Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.content}>
              欢迎使用票次元！在您使用我们的服务前，请仔细阅读并同意
              <Text style={styles.link} onPress={openPrivacy}>《隐私政策》</Text>
              和
              <Text style={styles.link} onPress={openTerms}>《服务条款》</Text>
              。{'\n\n'}
              我们将严格保护您的个人信息安全，仅在必要范围内收集和使用您的数据。
              {'\n\n'}
              我们重视您的隐私，承诺：{'\n'}
              1. 仅收集提供服务所必需的信息；{'\n'}
              2. 不会将您的个人信息出售给第三方；{'\n'}
              3. 采用行业标准的安全措施保护您的数据；{'\n'}
              4. 您可以随时查看、修改或删除您的个人信息。
            </Text>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.disagreeButton}
              onPress={handleDisagree}
              activeOpacity={0.7}
            >
              <Text style={styles.disagreeText}>不同意</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.7}
            >
              <Text style={styles.acceptText}>同意并继续</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  scrollArea: {
    marginBottom: SPACING.lg,
  },
  content: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  disagreeButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  disagreeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
