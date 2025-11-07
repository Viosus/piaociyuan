import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Modal from './Modal';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatarUri: string) => void;
  visible: boolean;
  onClose: () => void;
}

// 预设头像列表（使用 emoji 或颜色作为默认头像）
const PRESET_AVATARS = [
  { id: 1, color: '#FF6B6B', emoji: '😀' },
  { id: 2, color: '#4ECDC4', emoji: '😎' },
  { id: 3, color: '#45B7D1', emoji: '🎭' },
  { id: 4, color: '#FFA07A', emoji: '🎨' },
  { id: 5, color: '#98D8C8', emoji: '🎵' },
  { id: 6, color: '#F7DC6F', emoji: '⭐' },
  { id: 7, color: '#BB8FCE', emoji: '🎪' },
  { id: 8, color: '#85C1E2', emoji: '🎯' },
  { id: 9, color: '#F8B88B', emoji: '🎸' },
  { id: 10, color: '#FAD7A0', emoji: '🎤' },
  { id: 11, color: '#D7BDE2', emoji: '🎬' },
  { id: 12, color: '#A9DFBF', emoji: '🎮' },
];

export default function AvatarPicker({
  currentAvatar,
  onSelect,
  visible,
  onClose,
}: AvatarPickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '需要相机权限才能拍照');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '需要相册权限才能选择照片');
        return false;
      }
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSelect(result.assets[0].uri);
      onClose();
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSelect(result.assets[0].uri);
      onClose();
    }
  };

  const selectPreset = (preset: typeof PRESET_AVATARS[0]) => {
    setSelectedPreset(preset.id);
    // 使用 emoji 作为头像标识
    onSelect(`preset:${preset.id}`);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="选择头像">
      <ScrollView style={styles.container}>
        {/* 当前头像 */}
        {currentAvatar && (
          <View style={styles.currentSection}>
            <Text style={styles.sectionTitle}>当前头像</Text>
            <View style={styles.currentAvatar}>
              {currentAvatar.startsWith('preset:') ? (
                <View
                  style={[
                    styles.presetAvatar,
                    {
                      backgroundColor:
                        PRESET_AVATARS.find(
                          (p) => p.id === parseInt(currentAvatar.split(':')[1])
                        )?.color || COLORS.primary,
                    },
                  ]}
                >
                  <Text style={styles.presetEmoji}>
                    {PRESET_AVATARS.find(
                      (p) => p.id === parseInt(currentAvatar.split(':')[1])
                    )?.emoji || '😀'}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: currentAvatar }} style={styles.currentAvatarImage} />
              )}
            </View>
          </View>
        )}

        {/* 拍照和相册 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>上传照片</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>拍照</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={32} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>相册</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 预设头像 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预设头像</Text>
          <View style={styles.presetGrid}>
            {PRESET_AVATARS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetItem,
                  selectedPreset === preset.id && styles.presetItemSelected,
                ]}
                onPress={() => selectPreset(preset)}
              >
                <View
                  style={[
                    styles.presetAvatar,
                    { backgroundColor: preset.color },
                  ]}
                >
                  <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  currentSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  currentAvatar: {
    marginTop: SPACING.md,
  },
  currentAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  actionButtonText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetItem: {
    width: '23%',
    aspectRatio: 1,
    marginBottom: SPACING.md,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    borderColor: COLORS.primary,
  },
  presetAvatar: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetEmoji: {
    fontSize: 32,
  },
});
