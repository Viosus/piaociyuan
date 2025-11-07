/**
 * 用户列表项组件
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, fontSize } from '../constants/config';
import { FollowUser } from '../services/users';

interface UserListItemProps {
  user: FollowUser;
  onPress?: () => void;
  onFollow?: () => void;
  followLoading?: boolean;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onPress,
  onFollow,
  followLoading = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userInfo} onPress={onPress} activeOpacity={0.7}>
        <Image
          source={{ uri: user.avatar || 'https://via.placeholder.com/48' }}
          style={styles.avatar}
        />
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          {user.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {onFollow && (
        <TouchableOpacity
          style={[
            styles.followButton,
            user.isFollowing && styles.followingButton,
          ]}
          onPress={onFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator
              size="small"
              color={user.isFollowing ? colors.primary : '#ffffff'}
            />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                user.isFollowing && styles.followingButtonText,
              ]}
            >
              {user.isFollowing ? '已关注' : '关注'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  details: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nickname: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  verifiedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  followingButtonText: {
    color: colors.primary,
  },
});
