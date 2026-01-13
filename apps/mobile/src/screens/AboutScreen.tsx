import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/config';
import * as Application from 'expo-application';

export default function AboutScreen() {
  const version = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // 静默处理打开链接失败
    });
  };

  const menuItems = [
    {
      icon: 'document-text-outline' as const,
      title: '用户协议',
      url: 'https://piaociyuan.com/terms',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: '隐私政策',
      url: 'https://piaociyuan.com/privacy',
    },
    {
      icon: 'help-circle-outline' as const,
      title: '帮助中心',
      url: 'https://piaociyuan.com/help',
    },
    {
      icon: 'mail-outline' as const,
      title: '联系我们',
      url: 'mailto:support@piaociyuan.com',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Logo 区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="ticket" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>票次元</Text>
          <Text style={styles.slogan}>让每一场演出都成为永恒的回忆</Text>
          <Text style={styles.version}>
            版本 {version} ({buildNumber})
          </Text>
        </View>

        {/* 菜单列表 */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleLink(item.url)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 关于我们 */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>关于票次元</Text>
          <Text style={styles.aboutText}>
            票次元是一个专注于演唱会、音乐节、戏剧等文娱活动的票务平台。我们致力于为用户提供便捷的购票体验，同时结合区块链技术，将每一张门票转化为独特的数字藏品，让每一场演出都成为永恒的回忆。
          </Text>
          <Text style={styles.aboutText}>
            我们相信，文化娱乐不仅是一种消费，更是一种体验和记忆的载体。通过票次元，您可以：
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• 快速购买心仪的演出门票</Text>
            <Text style={styles.featureItem}>• 将门票转化为独特的 NFT 数字藏品</Text>
            <Text style={styles.featureItem}>• 与其他乐迷分享您的观演体验</Text>
            <Text style={styles.featureItem}>• 收藏和展示您的文娱足迹</Text>
          </View>
        </View>

        {/* 版权信息 */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 票次元 Piaociyuan.com
          </Text>
          <Text style={styles.copyrightText}>All rights reserved.</Text>
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
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  slogan: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  version: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  menuSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  aboutSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  aboutTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  aboutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  featureList: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  featureItem: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
  },
  copyrightText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
