/**
 * 发帖页面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, spacing, fontSize } from '../constants/config';
import { createPost, uploadPostImage } from '../services/posts';

const MAX_IMAGES = 9;

interface SelectedEvent {
  id: string;
  name: string;
}

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);

  const handlePickImages = async () => {
    try {
      // 请求媒体库权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限才能选择图片');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages].slice(0, MAX_IMAGES));
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '选择图片失败');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // 请求相机权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相机权限才能拍照');
        return;
      }

      // 拍照
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        if (images.length < MAX_IMAGES) {
          setImages([...images, result.assets[0].uri]);
        } else {
          Alert.alert('提示', `最多只能添加${MAX_IMAGES}张图片`);
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '拍照失败');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSelectEvent = () => {
    // 跳转到活动选择页面（如果有的话）
    // 这里简化实现，直接Alert让用户输入活动ID和名称
    Alert.prompt(
      '关联活动',
      '请输入活动ID（调试用）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (eventId: string | undefined) => {
            if (eventId && eventId.trim()) {
              setSelectedEvent({
                id: eventId.trim(),
                name: `活动 #${eventId}`,
              });
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRemoveEvent = () => {
    setSelectedEvent(null);
  };

  const handleGetCurrentLocation = async () => {
    try {
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问位置权限才能获取当前位置');
        return;
      }

      // 获取当前位置
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // 反向地理编码（获取地址）
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const locationString = `${address.city || ''}${address.district || ''}${address.street || ''}`;
        setLocation(locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } else {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '获取位置失败');
    }
  };

  const handleSetLocationManually = () => {
    setShowLocationInput(true);
  };

  const handleRemoveLocation = () => {
    setLocation('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入帖子内容');
      return;
    }

    if (content.length > 1000) {
      Alert.alert('提示', '帖子内容不能超过1000字');
      return;
    }

    try {
      setSubmitting(true);

      // 上传图片
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        const uploadPromises = images.map((uri) => uploadPostImage(uri));
        const results = await Promise.all(uploadPromises);
        uploadedImageUrls = results
          .filter((r) => r.ok && r.data)
          .map((r) => r.data!.url);
        setUploading(false);
      }

      // 创建帖子
      const response = await createPost({
        content: content.trim(),
        images: uploadedImageUrls,
        eventId: selectedEvent?.id ? Number(selectedEvent.id) : undefined,
        location: location || undefined,
      });

      if (response.ok) {
        Alert.alert('成功', '发帖成功', [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('失败', response.error || '发帖失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '发帖失败');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !submitting && !uploading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>发帖</Text>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>发布</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 文本输入 */}
          <TextInput
            style={styles.textInput}
            placeholder="分享你的精彩瞬间..."
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            autoFocus
          />

          {/* 图片预览 */}
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 上传进度 */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingText}>图片上传中...</Text>
            </View>
          )}

          {/* 字数统计 */}
          <Text style={styles.charCount}>
            {content.length}/1000
          </Text>
        </ScrollView>

        {/* 底部工具栏 */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handlePickImages}
            disabled={images.length >= MAX_IMAGES || submitting}
          >
            <Text style={styles.toolIcon}>🖼️</Text>
            <Text style={styles.toolText}>相册</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleTakePhoto}
            disabled={images.length >= MAX_IMAGES || submitting}
          >
            <Text style={styles.toolIcon}>📷</Text>
            <Text style={styles.toolText}>拍照</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <Text style={styles.imageCount}>
              {images.length}/{MAX_IMAGES}
            </Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: spacing.sm,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  textInput: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageIcon: {
    fontSize: fontSize.sm,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  charCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolIcon: {
    fontSize: fontSize.xl,
  },
  toolText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  imageCount: {
    marginLeft: 'auto',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
