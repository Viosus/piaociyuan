import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { sendVerificationCode } from '../services/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!phone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setSendingCode(true);
    try {
      await sendVerificationCode(phone);
      Alert.alert('成功', '验证码已发送');

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('发送失败', error.message || '请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    if (!phone || !password || !verificationCode) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (password.length < 6) {
      Alert.alert('提示', '密码长度至少为 6 位');
      return;
    }

    setLoading(true);
    try {
      await register(phone, password, verificationCode, nickname);
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请检查输入信息');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>开始您的票次元之旅</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="手机号 *"
            placeholder="请输入手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <View style={styles.codeRow}>
            <Input
              label="验证码 *"
              placeholder="请输入验证码"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              style={styles.codeInput}
            />
            <Button
              title={countdown > 0 ? `${countdown}s` : '发送验证码'}
              onPress={handleSendCode}
              loading={sendingCode}
              disabled={countdown > 0}
              size="small"
              style={styles.sendCodeButton}
            />
          </View>

          <Input
            label="昵称"
            placeholder="请输入昵称（可选）"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />

          <Input
            label="密码 *"
            placeholder="请输入密码（至少 6 位）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <Text style={styles.showPasswordText}>
                {showPassword ? '隐藏' : '显示'}
              </Text>
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Button
            title="注册"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>已有账号？</Text>
            <Button
              title="立即登录"
              onPress={() => navigation.goBack()}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  codeInput: {
    flex: 1,
  },
  sendCodeButton: {
    marginBottom: SPACING.md,
    minWidth: 100,
  },
  showPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  registerButton: {
    marginTop: SPACING.lg,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});
