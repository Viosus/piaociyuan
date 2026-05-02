import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请输入手机号和密码');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password, rememberMe);
    } catch (error: any) {
      // 账号被锁（5 次错密码触发）— 显示倒计时
      if (error.code === 'ACCOUNT_LOCKED') {
        const sec = error.retryAfterSec ?? 60;
        const minutes = Math.ceil(sec / 60);
        Alert.alert(
          '账号已被锁定',
          `连续输入错误密码次数过多，请 ${
            sec >= 60 ? `${minutes} 分钟` : `${sec} 秒`
          }后再试。`
        );
        return;
      }

      // 普通密码错 / 账号不存在 — 显示剩余尝试次数（如有）
      if (typeof error.attemptsLeft === 'number') {
        Alert.alert(
          '登录失败',
          `${error.message || '账号或密码错误'}\n剩余尝试次数：${error.attemptsLeft}`
        );
        return;
      }

      // 其他错误（网络挂、第三方登录等）
      Alert.alert('登录失败', error.message || '请检查手机号和密码');
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
          <Text style={styles.title}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录您的账号</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="手机号"
            placeholder="请输入手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Input
            label="密码"
            placeholder="请输入密码"
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

          {/* 记住我选项 */}
          <TouchableOpacity
            style={styles.rememberMeRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>30天内免登录</Text>
          </TouchableOpacity>

          <Button
            title="登录"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <Button
              title="立即注册"
              onPress={() => navigation.navigate('Register')}
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
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
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
  showPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  loginButton: {
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
