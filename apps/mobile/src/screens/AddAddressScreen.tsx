/**
 * 添加/编辑地址页面
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
  createAddress,
  updateAddress,
  ADDRESS_LABEL_LABELS,
  type UserAddress,
  type AddressLabel,
  type CreateAddressRequest,
} from '../services/personalInfo';
import { validateAddress } from '../utils/validation';

// 地址标签选项
const LABEL_OPTIONS: { value: AddressLabel; label: string; icon: string }[] = [
  { value: 'home', label: '家', icon: '🏠' },
  { value: 'work', label: '公司', icon: '🏢' },
  { value: 'other', label: '其他', icon: '📍' },
];

// 常用国家
const COUNTRY_OPTIONS = ['中国', '美国', '日本', '韩国', '英国', '加拿大', '澳大利亚'];

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editAddress = (route.params as { address?: UserAddress })?.address;
  const isEditing = !!editAddress;

  const [recipientName, setRecipientName] = useState(editAddress?.recipientName || '');
  const [recipientPhone, setRecipientPhone] = useState(editAddress?.recipientPhone || '');
  const [country, setCountry] = useState(editAddress?.country || '中国');
  const [province, setProvince] = useState(editAddress?.province || '');
  const [city, setCity] = useState(editAddress?.city || '');
  const [district, setDistrict] = useState(editAddress?.district || '');
  const [street, setStreet] = useState(editAddress?.street || '');
  const [addressDetail, setAddressDetail] = useState(editAddress?.addressDetail || '');
  const [postalCode, setPostalCode] = useState(editAddress?.postalCode || '');
  const [label, setLabel] = useState<AddressLabel | ''>(editAddress?.label as AddressLabel || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // 更新标题
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '编辑地址' : '添加地址',
    });
  }, [isEditing, navigation]);

  const handleSubmit = async () => {
    // 验证
    const validation = validateAddress({
      recipientName,
      recipientPhone,
      country,
      province,
      city,
      district,
      addressDetail,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const data: CreateAddressRequest = {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        country: country.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        street: street.trim() || undefined,
        addressDetail: addressDetail.trim(),
        postalCode: postalCode.trim() || undefined,
        label: label || undefined,
      };

      if (isEditing) {
        const response = await updateAddress(editAddress.id, data);
        if (response.ok) {
          Alert.alert('成功', '地址更新成功', [
            { text: '确定', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('失败', response.error || '更新失败');
        }
      } else {
        const response = await createAddress(data);
        if (response.ok) {
          Alert.alert('成功', '地址添加成功', [
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

  const renderInput = (
    labelText: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string;
      error?: string;
      keyboardType?: 'default' | 'phone-pad' | 'numeric';
      maxLength?: number;
      multiline?: boolean;
      required?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {labelText}
        {options?.required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          options?.error && styles.inputError,
          options?.multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={options?.keyboardType || 'default'}
        maxLength={options?.maxLength}
        multiline={options?.multiline}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
      />
      {options?.error && <Text style={styles.errorText}>{options.error}</Text>}
    </View>
  );

  const renderLabelSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>地址标签（可选）</Text>
      <View style={styles.labelRow}>
        {LABEL_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.labelOption,
              label === option.value && styles.labelOptionActive,
            ]}
            onPress={() => setLabel(label === option.value ? '' : option.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.labelIcon}>{option.icon}</Text>
            <Text style={[
              styles.labelText,
              label === option.value && styles.labelTextActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCountrySelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        国家/地区
        <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowCountryPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectText}>{country}</Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>

      {showCountryPicker && (
        <View style={styles.pickerContainer}>
          {COUNTRY_OPTIONS.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.pickerOption,
                country === c && styles.pickerOptionActive,
              ]}
              onPress={() => {
                setCountry(c);
                setShowCountryPicker(false);
              }}
            >
              <Text style={[
                styles.pickerOptionText,
                country === c && styles.pickerOptionTextActive,
              ]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
          {/* 收件人信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>收件人信息</Text>

            {renderInput('收件人姓名', recipientName, setRecipientName, {
              placeholder: '请输入收件人姓名',
              error: errors.recipientName,
              maxLength: 20,
              required: true,
            })}

            {renderInput('收件人电话', recipientPhone, setRecipientPhone, {
              placeholder: '请输入收件人电话',
              error: errors.recipientPhone,
              keyboardType: 'phone-pad',
              maxLength: 15,
              required: true,
            })}
          </View>

          {/* 地址信息 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>收货地址</Text>

            {renderCountrySelector()}

            {renderInput('省/直辖市/州', province, setProvince, {
              placeholder: country === '中国' ? '如：北京市、广东省' : '请输入省/州',
              error: errors.province,
              maxLength: 50,
              required: true,
            })}

            {renderInput('市', city, setCity, {
              placeholder: country === '中国' ? '如：北京市、深圳市' : '请输入城市',
              error: errors.city,
              maxLength: 50,
              required: true,
            })}

            {renderInput('区/县', district, setDistrict, {
              placeholder: country === '中国' ? '如：朝阳区、南山区' : '请输入区/县',
              error: errors.district,
              maxLength: 50,
              required: true,
            })}

            {renderInput('街道（可选）', street, setStreet, {
              placeholder: '如：建国路、科技园路',
              maxLength: 100,
            })}

            {renderInput('详细地址', addressDetail, setAddressDetail, {
              placeholder: '如：XX小区XX栋XX单元XX室',
              error: errors.addressDetail,
              maxLength: 200,
              multiline: true,
              required: true,
            })}

            {renderInput('邮政编码（可选）', postalCode, setPostalCode, {
              placeholder: '如：100000',
              keyboardType: 'numeric',
              maxLength: 10,
            })}

            {renderLabelSelector()}
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
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? '保存修改' : '添加地址'}
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
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
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
  inputMultiline: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  selectArrow: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionActive: {
    backgroundColor: `${colors.primary}15`,
  },
  pickerOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  labelOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  labelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  labelIcon: {
    fontSize: 16,
  },
  labelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  labelTextActive: {
    color: colors.text,
    fontWeight: '600',
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
    color: colors.text,
  },
});
