import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';
import { changePassword } from '../services/verification';
import { validatePassword } from '../utils/validation';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // 表单验证
    if (!currentPassword) {
      Alert.alert('提示', '请输入当前密码');
      return;
    }

    if (!newPassword) {
      Alert.alert('提示', '请输入新密码');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('提示', passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的新密码不一致');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('提示', '新密码不能与当前密码相同');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.ok) {
        Alert.alert('成功', '密码修改成功，请重新登录', [
          {
            text: '确定',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('错误', result.error || '修改密码失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>修改密码</Text>
          <Text style={styles.description}>
            为了您的账户安全，请定期修改密码
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>当前密码</Text>
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="请输入当前密码"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>新密码</Text>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="请输入新密码"
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              密码长度 8-20 位，需包含字母和数字
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>确认新密码</Text>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="请再次输入新密码"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? '提交中...' : '确认修改'}
            onPress={handleChangePassword}
            disabled={loading}
          />
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>密码安全提示：</Text>
          <Text style={styles.tipsText}>• 不要使用过于简单的密码</Text>
          <Text style={styles.tipsText}>• 不要使用与其他网站相同的密码</Text>
          <Text style={styles.tipsText}>• 建议定期更换密码</Text>
          <Text style={styles.tipsText}>• 不要将密码告诉他人</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  tips: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tipsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
