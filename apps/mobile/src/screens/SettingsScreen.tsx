import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../constants/config';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [eventUpdates, setEventUpdates] = useState(true);
  const [postLikes, setPostLikes] = useState(true);

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert('错误', error.message || '退出登录失败');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const accountItems = [
    {
      icon: 'key-outline' as const,
      title: '修改密码',
      onPress: () => navigation.navigate('ChangePassword' as never),
    },
  ];

  const aboutItems = [
    {
      icon: 'information-circle-outline' as const,
      title: '关于票次元',
      onPress: () => navigation.navigate('About' as never),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 账号安全 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账号安全</Text>
          {accountItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.text}
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

        {/* 通知设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知设置</Text>

          <View style={styles.switchItem}>
            <View style={styles.switchItemLeft}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={COLORS.text}
              />
              <View style={styles.switchItemText}>
                <Text style={styles.menuItemText}>推送通知</Text>
                <Text style={styles.switchItemDescription}>
                  接收重要通知和消息
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchItemLeft}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={COLORS.text}
              />
              <View style={styles.switchItemText}>
                <Text style={styles.menuItemText}>活动提醒</Text>
                <Text style={styles.switchItemDescription}>
                  关注的活动开售和更新提醒
                </Text>
              </View>
            </View>
            <Switch
              value={eventUpdates}
              onValueChange={setEventUpdates}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchItemLeft}>
              <Ionicons
                name="heart-outline"
                size={24}
                color={COLORS.text}
              />
              <View style={styles.switchItemText}>
                <Text style={styles.menuItemText}>互动通知</Text>
                <Text style={styles.switchItemDescription}>
                  帖子点赞、评论和关注通知
                </Text>
              </View>
            </View>
            <Switch
              value={postLikes}
              onValueChange={setPostLikes}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          {aboutItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.text}
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

        {/* 退出登录 */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>
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
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
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
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  switchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchItemText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  switchItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  logoutSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  logoutButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
});
