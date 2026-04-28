import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';

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

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    following: 0,
    followers: 0,
    posts: 0,
  });

  const renderAvatar = () => {
    const avatar = user?.avatar;

    if (!avatar) {
      return (
        <View style={[styles.avatar, { backgroundColor: COLORS.border }]}>
          <Ionicons name="person" size={40} color={COLORS.textSecondary} />
        </View>
      );
    }

    if (avatar.startsWith('preset:')) {
      const presetId = parseInt(avatar.split(':')[1]);
      const preset = PRESET_AVATARS.find((p) => p.id === presetId);
      if (preset) {
        return (
          <View style={[styles.avatar, { backgroundColor: preset.color }]}>
            <Text style={styles.presetEmoji}>{preset.emoji}</Text>
          </View>
        );
      }
    }

    return <Image source={{ uri: avatar }} style={styles.avatar} />;
  };

  const menuSections = [
    {
      title: '我的资产',
      items: [
        { icon: 'receipt-outline' as const, label: '我的订单', screen: 'Orders', emoji: '📦' },
        { icon: 'heart-outline' as const, label: '我的收藏', screen: 'Favorites', emoji: '⭐' },
        { icon: 'diamond-outline' as const, label: '我的收藏品', screen: 'MyCollectibles', emoji: '🎨' },
      ],
    },
    {
      title: '社区互动',
      items: [
        { icon: 'flame-outline' as const, label: '安可区', screen: 'Encore', emoji: '🔥' },
        { icon: 'people-outline' as const, label: '关注列表', screen: 'FollowingList', emoji: '👥' },
        { icon: 'chatbubbles-outline' as const, label: '我的消息', screen: 'Conversations', emoji: '💬' },
      ],
    },
    {
      title: '个人信息',
      items: [
        { icon: 'id-card-outline' as const, label: '证件管理', screen: 'IdDocuments', emoji: '🪪' },
        { icon: 'location-outline' as const, label: '地址管理', screen: 'Addresses', emoji: '📍' },
      ],
    },
    {
      title: '账号设置',
      items: [
        { icon: 'create-outline' as const, label: '编辑资料', screen: 'EditProfile', emoji: '✏️' },
        { icon: 'shield-checkmark-outline' as const, label: '身份认证', screen: 'Verification', emoji: '🛡️' },
        { icon: 'settings-outline' as const, label: '设置', screen: 'Settings', emoji: '⚙️' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息区 */}
      <View style={styles.header}>
        {renderAvatar()}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.nickname || '未设置昵称'}</Text>
            {user?.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.phone}>{user?.phone || user?.email}</Text>
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.editButtonText}>编辑资料</Text>
        </TouchableOpacity>
      </View>

      {/* 统计数据 */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => (navigation as any).navigate('FollowingList', { userId: user?.id })}
        >
          <Text style={styles.statValue}>{stats.following}</Text>
          <Text style={styles.statLabel}>关注</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => (navigation as any).navigate('FollowerList', { userId: user?.id })}
        >
          <Text style={styles.statValue}>{stats.followers}</Text>
          <Text style={styles.statLabel}>粉丝</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem}>
          <Text style={styles.statValue}>{stats.posts}</Text>
          <Text style={styles.statLabel}>帖子</Text>
        </TouchableOpacity>
      </View>

      {/* 菜单区域 */}
      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.title}</Text>
          <View style={styles.menuItems}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen as never)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIconBg}>
                    <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* 退出登录 */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </View>

      {/* 底部间距 */}
      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  presetEmoji: {
    fontSize: 40,
  },
  userInfo: {
    marginBottom: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  phone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  menuSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  menuSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  menuItems: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  logoutSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
});
