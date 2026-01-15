/**
 * 添加/编辑证件页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../constants/config';
import {
  createIdDocument,
  updateIdDocument,
  ID_TYPE_LABELS,
  type UserIdDocument,
  type IdDocumentType,
  type CreateIdDocumentRequest,
} from '../services/personalInfo';
import { validateIdDocument } from '../utils/validation';

// 证件类型选项
const ID_TYPE_OPTIONS: { value: IdDocumentType; label: string; icon: string }[] = [
  { value: 'china_id', label: '身份证', icon: '🪪' },
  { value: 'passport', label: '护照', icon: '📕' },
  { value: 'hk_permit', label: '港澳通行证', icon: '📗' },
  { value: 'tw_permit', label: '台湾通行证', icon: '📘' },
];

// 性别选项
const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

export default function AddIdDocumentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editDocument = (route.params as { document?: UserIdDocument })?.document;
  const isEditing = !!editDocument;

  const [idType, setIdType] = useState<IdDocumentType>(editDocument?.idType || 'china_id');
  const [fullName, setFullName] = useState(editDocument?.fullName || '');
  const [idNumber, setIdNumber] = useState(editDocument?.idNumber || '');
  const [expiryDate, setExpiryDate] = useState(editDocument?.expiryDate || '');
  const [issuingAuthority, setIssuingAuthority] = useState(editDocument?.issuingAuthority || '');
  const [nationality, setNationality] = useState(editDocument?.nationality || '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(editDocument?.gender || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 更新标题
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '编辑证件' : '添加证件',
    });
  }, [isEditing, navigation]);

  const handleSubmit = async () => {
    // 验证
    const validation = validateIdDocument({
      idType,
      fullName,
      idNumber: isEditing ? editDocument.idNumber : idNumber,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      if (isEditing) {
        // 更新证件（不能修改证件类型和号码）
        const response = await updateIdDocument(editDocument.id, {
          fullName: fullName.trim(),
          expiryDate: expiryDate || undefined,
          issuingAuthority: issuingAuthority.trim() || undefined,
          nationality: nationality.trim() || undefined,
          gender: gender || undefined,
        });

        if (response.ok) {
          Alert.alert('成功', '证件更新成功', [
            { text: '确定', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('失败', response.error || '更新失败');
        }
      } else {
        // 创建新证件
        const data: CreateIdDocumentRequest = {
          idType,
          fullName: fullName.trim(),
          idNumber: idNumber.toUpperCase().trim(),
          expiryDate: expiryDate || undefined,
          issuingAuthority: issuingAuthority.trim() || undefined,
          nationality: nationality.trim() || undefined,
          gender: gender || undefined,
        };

        const response = await createIdDocument(data);

        if (response.ok) {
          Alert.alert('成功', '证件添加成功', [
            { text: '确定', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('失败', response.error || '添加失败');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>证件类型</Text>
      <View style={styles.typeGrid}>
        {ID_TYPE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.typeOption,
              idType === option.value && styles.typeOptionActive,
              isEditing && styles.typeOptionDisabled,
            ]}
            onPress={() => !isEditing && setIdType(option.value)}
            disabled={isEditing}
            activeOpacity={0.7}
          >
            <Text style={styles.typeIcon}>{option.icon}</Text>
            <Text style={[
              styles.typeLabel,
              idType === option.value && styles.typeLabelActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.idType && <Text style={styles.errorText}>{errors.idType}</Text>}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      error?: string;
      disabled?: boolean;
      keyboardType?: 'default' | 'numeric';
      autoCapitalize?: 'none' | 'characters';
      maxLength?: number;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options?.error && styles.inputError,
          options?.disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor={colors.textSecondary}
        editable={!options?.disabled}
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize || 'none'}
        maxLength={options?.maxLength}
      />
      {options?.error && <Text style={styles.errorText}>{options.error}</Text>}
    </View>
  );

  const renderGenderSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>性别（可选）</Text>
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.genderOption,
              gender === option.value && styles.genderOptionActive,
            ]}
            onPress={() => setGender(option.value as 'male' | 'female')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.genderLabel,
              gender === option.value && styles.genderLabelActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 证件类型选择 */}
          {renderTypeSelector()}

          {/* 基本信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>证件信息</Text>

            {renderInput('证件姓名', fullName, setFullName, {
              placeholder: '请输入证件上的姓名',
              error: errors.fullName,
              maxLength: 50,
            })}

            {renderInput('证件号码', idNumber, setIdNumber, {
              placeholder: '请输入证件号码',
              error: errors.idNumber,
              disabled: isEditing,
              autoCapitalize: 'characters',
              maxLength: 18,
            })}

            {renderInput('有效期至（可选）', expiryDate, setExpiryDate, {
              placeholder: '格式：2025-12-31',
              maxLength: 10,
            })}

            {renderInput('签发机关（可选）', issuingAuthority, setIssuingAuthority, {
              placeholder: '请输入签发机关',
              maxLength: 100,
            })}

            {/* 护照特有字段 */}
            {idType === 'passport' && (
              <>
                {renderInput('国籍（可选）', nationality, setNationality, {
                  placeholder: '请输入国籍',
                  maxLength: 50,
                })}
                {renderGenderSelector()}
              </>
            )}
          </View>

          {/* 提示 */}
          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              证件信息仅用于购票实名认证，我们会严格保护您的隐私
            </Text>
          </View>
        </ScrollView>

        {/* 提交按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? '保存修改' : '添加证件'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  typeOptionDisabled: {
    opacity: 0.6,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.border,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  genderLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  genderLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipIcon: {
    fontSize: fontSize.lg,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#000',
  },
});
