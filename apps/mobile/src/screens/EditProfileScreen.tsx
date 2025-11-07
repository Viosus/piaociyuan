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
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import AvatarPicker from '../components/AvatarPicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import { updateProfile, uploadAvatar } from '../services/verification';

// 预设头像配置（与 AvatarPicker 保持一致）
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

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAvatarSelect = (avatarUri: string) => {
    setAvatar(avatarUri);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }

    setLoading(true);
    try {
      let finalAvatar = avatar;

      // 如果选择了新头像（非 preset 且不是当前头像）
      if (avatar && !avatar.startsWith('preset:') && avatar !== user?.avatar) {
        const uploadResult = await uploadAvatar(avatar);
        if (uploadResult.success && uploadResult.data) {
          finalAvatar = uploadResult.data.url;
        }
      }

      const result = await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
        website: website.trim(),
        location: location.trim(),
        avatar: finalAvatar,
      });

      if (result.success) {
        Alert.alert('成功', '资料已更新', [
          {
            text: '确定',
            onPress: async () => {
              await refreshUser();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('错误', result.error || '更新资料失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '更新资料失败');
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = () => {
    if (!avatar) {
      return (
        <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.border }]}>
          <Ionicons name="person" size={40} color={COLORS.textSecondary} />
        </View>
      );
    }

    if (avatar.startsWith('preset:')) {
      const presetId = parseInt(avatar.split(':')[1]);
      const preset = PRESET_AVATARS.find((p) => p.id === presetId);
      if (preset) {
        return (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: preset.color },
            ]}
          >
            <Text style={styles.presetEmoji}>{preset.emoji}</Text>
          </View>
        );
      }
    }

    return <Image source={{ uri: avatar }} style={styles.avatar} />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 头像区域 */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowAvatarPicker(true)}
        >
          {renderAvatar()}
          <View style={styles.avatarEditIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>点击更换头像</Text>

        {/* 表单区域 */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>昵称 *</Text>
            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder="请输入昵称"
              maxLength={30}
            />
            <Text style={styles.hint}>{nickname.length}/30</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>个人简介</Text>
            <Input
              value={bio}
              onChangeText={setBio}
              placeholder="介绍一下自己吧"
              multiline
              numberOfLines={4}
              maxLength={200}
              style={styles.textarea}
            />
            <Text style={styles.hint}>{bio.length}/200</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>个人网站</Text>
            <Input
              value={website}
              onChangeText={setWebsite}
              placeholder="https://"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>所在地</Text>
            <Input
              value={location}
              onChangeText={setLocation}
              placeholder="请输入所在地"
            />
          </View>
        </View>

        {/* 保存按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? '保存中...' : '保存'}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      </View>

      {/* 头像选择器 */}
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={avatar}
        onSelect={handleAvatarSelect}
      />
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
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetEmoji: {
    fontSize: 48,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    marginTop: SPACING.md,
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
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
});
