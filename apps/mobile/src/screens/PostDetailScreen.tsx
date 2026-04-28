import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAccessToken } from '../services/storage';
import { API_URL } from '../config/api';
import { colors, spacing, fontSize } from '../constants/config';
import { socketService, SocketEvent } from '../services/socket';

const { width } = Dimensions.get('window');

interface PostDetail {
  id: string;
  content: string;
  location?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
    isVerified: boolean;
  };
  event?: {
    id: string;
    name: string;
    city: string;
    venue: string;
    date: string;
    coverImage: string;
  };
  images: {
    id: string;
    imageUrl: string;
  }[];
  comments: any[];
}

export default function PostDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params as { postId: string };

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadPost();
    checkLikeStatus();
  }, [postId]);

  // 实时评论：订阅 comment:new 事件（commit 451008d Web 端引入，Mobile 现在补齐）
  // 服务端在 api/posts/[id]/comments/route.ts:314 emit 到 post:${postId} 房间
  useEffect(() => {
    if (!postId) return;

    socketService.joinPost(postId);

    const handleNewComment = (data: { postId: string }) => {
      if (data?.postId === postId) {
        // 简单做法：收到新评论时重新拉取整个 post（包含 comments 列表）
        loadPost();
      }
    };

    socketService.on(SocketEvent.NewComment, handleNewComment);

    return () => {
      socketService.off(SocketEvent.NewComment, handleNewComment);
      socketService.leavePost(postId);
    };
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/posts/${postId}`, { headers });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || '加载失败');
      }

      setPost(data.data);
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setIsLiked(data.data.isLiked);
        }
      }
    } catch {
      // 静默处理检查点赞状态失败
    }
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('提示', '请先登录');
        return;
      }

      setIsLiking(true);

      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '操作失败');
      }

      setIsLiked(data.data.isLiked);
      if (post) {
        setPost({
          ...post,
          likeCount: data.data.likeCount,
        });
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '操作失败');
    } finally {
      setIsLiking(false);
    }
  };

  const handleReport = async () => {
    setShowMoreMenu(false);

    Alert.prompt(
      '举报帖子',
      '请输入举报原因：',
      async (reason) => {
        if (!reason || !reason.trim()) {
          return;
        }

        try {
          const token = await getAccessToken();
          if (!token) {
            Alert.alert('提示', '请先登录');
            return;
          }

          const res = await fetch(`${API_URL}/posts/${postId}/report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              reason: reason.trim(),
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || '举报失败');
          }

          Alert.alert('成功', '举报成功，我们会尽快处理');
        } catch (error: any) {
          Alert.alert('错误', error.message || '举报失败');
        }
      },
      'plain-text'
    );
  };

  const handleShare = () => {
    Alert.alert('分享', '分享功能开发中...');
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('提示', '请先登录');
        return;
      }

      setIsSubmittingComment(true);

      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '评论失败');
      }

      setCommentText('');
      await loadPost();
      Alert.alert('成功', '评论成功');
    } catch (error: any) {
      Alert.alert('错误', error.message || '评论失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>帖子不存在</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMoreMenu(true)}>
          <Text style={styles.moreButton}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 图片轮播 */}
        {post.images.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {post.images.map((image) => (
                <Image
                  key={image.id}
                  source={{ uri: image.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {post.images.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {post.images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {post.user.avatar ? (
              <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {post.user.nickname[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.user.nickname}</Text>
            <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>

        {/* 帖子内容 */}
        <View style={styles.postContent}>
          <Text style={styles.contentText}>{post.content}</Text>
          {post.location && (
            <Text style={styles.locationText}>📍 {post.location}</Text>
          )}
        </View>

        {/* 关联活动 */}
        {post.event && (
          <TouchableOpacity style={styles.eventCard}>
            <Image
              source={{ uri: post.event.coverImage || post.event.cover }}
              style={styles.eventCover}
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{post.event.name}</Text>
              <Text style={styles.eventDetails}>
                {post.event.city} · {post.event.venue}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 互动数据 */}
        <View style={styles.stats}>
          <Text style={styles.statText}>👁 {post.viewCount}</Text>
          <Text style={styles.statText}>❤️ {post.likeCount}</Text>
          <Text style={styles.statText}>💬 {post.commentCount}</Text>
        </View>

        {/* 评论列表 */}
        <View style={styles.comments}>
          <Text style={styles.commentsTitle}>
            评论 ({post.commentCount})
          </Text>
          {post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentUser}>{comment.user.nickname}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>还没有评论</Text>
          )}
        </View>
      </ScrollView>

      {/* 底部互动栏 */}
      <View style={styles.bottomBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="说点什么..."
          value={commentText}
          onChangeText={setCommentText}
          editable={!isSubmittingComment}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSubmitComment}
          disabled={isSubmittingComment || !commentText.trim()}
        >
          <Text style={styles.sendButtonText}>发送</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={isLiking}
        >
          <Text style={isLiked ? styles.likedIcon : styles.likeIcon}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionIcon}>↗️</Text>
        </TouchableOpacity>
      </View>

      {/* 更多菜单 Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Text style={styles.menuItemText}>⚠️ 举报</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  moreButton: {
    fontSize: fontSize.xxl,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#000',
    position: 'relative',
  },
  postImage: {
    width: width,
    height: width,
  },
  imageIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
  },
  imageIndicatorText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
  },
  userInfo: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  postDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  postContent: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentText: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.text,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventCover: {
    width: 64,
    height: 64,
    borderRadius: spacing.sm,
  },
  eventInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  eventName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  eventDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  comments: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  commentsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  comment: {
    marginBottom: spacing.md,
  },
  commentUser: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  commentText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  commentDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  noComments: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  sendButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  actionButton: {
    padding: spacing.sm,
  },
  actionIcon: {
    fontSize: fontSize.lg,
  },
  likeIcon: {
    fontSize: fontSize.lg,
  },
  likedIcon: {
    fontSize: fontSize.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    alignSelf: 'center',
  },
  backButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
