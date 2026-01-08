/**
 * 帖子卡片组件
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, fontSize } from '../constants/config';
import { Post } from '../services/posts';
import { getRelativeTime } from '../utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onFavorite?: () => void;
  onUserPress?: () => void;
  onEventPress?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onFavorite,
  onUserPress,
  onEventPress,
}) => {
  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageCount = post.images.length;

    // 单张图片 - 大图显示
    if (imageCount === 1) {
      return (
        <TouchableOpacity style={styles.singleImageContainer} onPress={onPress} activeOpacity={0.9}>
          <Image
            source={post.images[0]}
            style={styles.singleImage}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>
      );
    }

    // 多张图片 - 网格显示（最多显示9张）
    const displayImages = post.images.slice(0, 9);
    return (
      <View style={styles.imagesGrid}>
        {displayImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.gridImage,
              { width: IMAGE_WIDTH, height: IMAGE_WIDTH },
            ]}
            onPress={onPress}
            activeOpacity={0.9}
          >
            <Image
              source={image}
              style={styles.gridImageContent}
              contentFit="cover"
              transition={200}
            />
            {index === 8 && post.images.length > 9 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{post.images.length - 9}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 用户信息 */}
      <TouchableOpacity
        style={styles.header}
        onPress={onUserPress}
        activeOpacity={0.7}
      >
        <Image
          source={post.user?.avatar || 'https://via.placeholder.com/40'}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{post.user?.nickname || '未知用户'}</Text>
            {post.user?.isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <Text style={styles.time}>{getRelativeTime(new Date(post.createdAt))}</Text>
        </View>
      </TouchableOpacity>

      {/* 帖子内容 */}
      <TouchableOpacity onPress={onPress} activeOpacity={1}>
        <Text style={styles.content} numberOfLines={6}>
          {post.content}
        </Text>

        {/* 关联活动 */}
        {post.event && (
          <TouchableOpacity
            style={styles.eventTag}
            onPress={onEventPress}
            activeOpacity={0.7}
          >
            <Text style={styles.eventIcon}>🎫</Text>
            <Text style={styles.eventName} numberOfLines={1}>
              {post.event.name}
            </Text>
          </TouchableOpacity>
        )}

        {/* 地理位置 */}
        {post.location && (
          <View style={styles.locationTag}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {post.location}
            </Text>
          </View>
        )}

        {/* 图片 */}
        {renderImages()}
      </TouchableOpacity>

      {/* 互动栏 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onLike}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>
            {post.likeCount > 0 ? post.likeCount : '点赞'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onComment}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>
            {post.commentCount > 0 ? post.commentCount : '评论'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onFavorite}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>{post.isFavorited ? '⭐' : '☆'}</Text>
          <Text style={[styles.actionText, post.isFavorited && styles.actionTextActive]}>
            收藏
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Text style={styles.actionIcon}>👁️</Text>
          <Text style={styles.actionText}>
            {post.viewCount > 0 ? post.viewCount : '浏览'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
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
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  time: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  eventIcon: {
    fontSize: fontSize.sm,
  },
  eventName: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
    maxWidth: SCREEN_WIDTH - 120,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  locationIcon: {
    fontSize: fontSize.sm,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    maxWidth: SCREEN_WIDTH - 100,
  },
  singleImageContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: SCREEN_WIDTH - spacing.lg * 2,
    backgroundColor: colors.border,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  gridImage: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImageContent: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: fontSize.lg,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
