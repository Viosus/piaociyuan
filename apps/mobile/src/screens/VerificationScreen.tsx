import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import {
  submitVerificationRequest,
  getVerificationStatus,
  uploadVerificationImage,
  type VerificationType,
  type VerificationStatus,
} from '../services/verification';

const VERIFICATION_TYPES = [
  { value: 'celebrity' as VerificationType, label: '名人认证', icon: 'star' as const },
  { value: 'artist' as VerificationType, label: '艺人认证', icon: 'musical-notes' as const },
  { value: 'organizer' as VerificationType, label: '主办方认证', icon: 'business' as const },
  { value: 'official' as VerificationType, label: '官方认证', icon: 'shield-checkmark' as const },
];

export default function VerificationScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 现有认证状态
  const [existingVerification, setExistingVerification] = useState<any>(null);

  // 表单字段
  const [selectedType, setSelectedType] = useState<VerificationType>('celebrity');
  const [realName, setRealName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [reason, setReason] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const result = await getVerificationStatus();
      if (result.success && result.data) {
        setExistingVerification(result.data);
      }
    } catch (error) {
      console.error('加载认证状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (proofImages.length >= 3) {
      Alert.alert('提示', '最多上传 3 张证明材料');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '需要相册权限才能选择照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uploadResult = await uploadVerificationImage(result.assets[0].uri);
        if (uploadResult.success && uploadResult.data) {
          setProofImages([...proofImages, uploadResult.data.url]);
        } else {
          Alert.alert('错误', '上传图片失败');
        }
      } catch (error: any) {
        Alert.alert('错误', error.message || '上传图片失败');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...proofImages];
    newImages.splice(index, 1);
    setProofImages(newImages);
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!realName.trim()) {
      Alert.alert('提示', '请输入真实姓名');
      return;
    }

    if (selectedType === 'organizer' && !organization.trim()) {
      Alert.alert('提示', '请输入机构名称');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('提示', '请填写申请理由');
      return;
    }

    if (proofImages.length === 0) {
      Alert.alert('提示', '请上传至少一张证明材料');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitVerificationRequest({
        type: selectedType,
        realName: realName.trim(),
        idNumber: idNumber.trim() || undefined,
        organization: organization.trim() || undefined,
        reason: reason.trim(),
        proofImages,
      });

      if (result.success) {
        Alert.alert('提交成功', '您的认证申请已提交，我们会在 3-5 个工作日内审核', [
          {
            text: '确定',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('错误', result.error || '提交申请失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '提交申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return '审核中';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  // 如果已有认证申请，显示状态
  if (existingVerification) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: getStatusColor(existingVerification.status) },
              ]}
            >
              <Ionicons
                name={
                  existingVerification.status === 'approved'
                    ? 'checkmark-circle'
                    : existingVerification.status === 'pending'
                    ? 'time'
                    : 'close-circle'
                }
                size={48}
                color="#fff"
              />
            </View>
            <Text style={styles.statusTitle}>
              认证状态：{getStatusText(existingVerification.status)}
            </Text>
            <Text style={styles.statusDescription}>
              {existingVerification.status === 'pending'
                ? '您的认证申请正在审核中，请耐心等待'
                : existingVerification.status === 'approved'
                ? '恭喜您，已通过身份认证！'
                : '很抱歉，您的认证申请未通过审核'}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>申请详情</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>认证类型</Text>
              <Text style={styles.detailValue}>
                {VERIFICATION_TYPES.find((t) => t.value === existingVerification.type)
                  ?.label || existingVerification.type}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>真实姓名</Text>
              <Text style={styles.detailValue}>{existingVerification.realName}</Text>
            </View>
            {existingVerification.organization && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>机构名称</Text>
                <Text style={styles.detailValue}>{existingVerification.organization}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>申请时间</Text>
              <Text style={styles.detailValue}>
                {new Date(existingVerification.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {existingVerification.status === 'rejected' && (
            <View style={styles.buttonContainer}>
              <Button
                title="重新申请"
                onPress={() => setExistingVerification(null)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // 申请表单
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>身份认证申请</Text>
          <Text style={styles.description}>
            通过身份认证可以获得专属认证标识，提升账号可信度
          </Text>
        </View>

        {/* 认证类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择认证类型</Text>
          <View style={styles.typeGrid}>
            {VERIFICATION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardSelected,
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Ionicons
                  name={type.icon}
                  size={32}
                  color={
                    selectedType === type.value ? COLORS.primary : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && styles.typeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 表单 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>申请信息</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>真实姓名 *</Text>
            <Input
              value={realName}
              onChangeText={setRealName}
              placeholder="请输入真实姓名"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>身份证号（可选）</Text>
            <Input
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="请输入身份证号"
              keyboardType="default"
            />
          </View>

          {(selectedType === 'organizer' || selectedType === 'official') && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>机构名称 *</Text>
              <Input
                value={organization}
                onChangeText={setOrganization}
                placeholder="请输入机构名称"
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>申请理由 *</Text>
            <Input
              value={reason}
              onChangeText={setReason}
              placeholder="请说明申请身份认证的理由"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textarea}
            />
            <Text style={styles.hint}>{reason.length}/500</Text>
          </View>
        </View>

        {/* 证明材料 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>证明材料（最多 3 张）</Text>
          <View style={styles.imagesGrid}>
            {proofImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.imageRemove}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            {proofImages.length < 3 && (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="camera"
                      size={32}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.imagePickerText}>上传证明</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hint}>
            请上传能够证明您身份的材料，如名片、工作证、营业执照等
          </Text>
        </View>

        {/* 提交按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            title={submitting ? '提交中...' : '提交申请'}
            onPress={handleSubmit}
            disabled={submitting}
          />
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1.5,
    margin: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  typeLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  typeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
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
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.medium,
  },
  imageRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  statusCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.lg,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.lg,
  },
  detailsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
});
