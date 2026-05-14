import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { apiClient } from '../../services/api';
import { isLoggedIn } from '../../services/auth';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import ImageSwiper from '../../components/ImageSwiper';
import CommentItem from '../../components/CommentItem';
import LikeButton from '../../components/LikeButton';
import FavoriteButton from '../../components/FavoriteButton';
import { toast } from '../../components/Toast';
import './index.scss';

interface PostDetail {
  id: string;
  content: string;
  images?: Array<{ id: string; imageUrl: string; width?: number; height?: number }>;
  user: { id: string; nickname: string; avatar: string | null; bio?: string | null; isVerified?: boolean };
  event?: { id: number; name: string; city?: string | null; date?: string | null; venue?: string | null } | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
  comments?: CommentData[];
  commentTotal?: number;
  commentHasMore?: boolean;
}

interface CommentData {
  id: string;
  content: string;
  likeCount?: number;
  replyCount?: number;
  createdAt: string;
  user: { id: string; nickname: string; avatar: string | null };
  replies?: Array<{ id: string; content: string; createdAt: string; user: { id: string; nickname: string; avatar: string | null } }>;
}

export default function PostDetailPage() {
  const router = useRouter();
  const id = router.params.id;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; nickname: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
    if (!id) {
      toast.error('缺少帖子 ID');
      Taro.navigateBack();
      return;
    }
    load();
  });

  const load = async () => {
    setLoading(true);
    const res = await apiClient.get<PostDetail>(`/api/posts/${id}`);
    if (res.ok && res.data) {
      setPost(res.data);
      setComments(res.data.comments || []);
      setCommentHasMore(!!res.data.commentHasMore);
      setCommentPage(1);
    } else {
      toast.error(res.error || '加载失败');
    }
    setLoading(false);
  };

  const loadMoreComments = async () => {
    if (loadingMore || !commentHasMore) return;
    setLoadingMore(true);
    const next = commentPage + 1;
    const res = await apiClient.get<CommentData[]>(`/api/posts/${id}/comments`, {
      params: { page: next, pageSize: 20 },
    });
    if (res.ok) {
      const list = Array.isArray(res.data) ? res.data : ((res.data as { data?: CommentData[] } | undefined)?.data || []);
      setComments((prev) => [...prev, ...list]);
      setCommentPage(next);
      setCommentHasMore(list.length >= 20);
    }
    setLoadingMore(false);
  };

  const handleReply = (commentId: string, nickname: string) => {
    setReplyTo({ commentId, nickname });
  };

  const cancelReply = () => setReplyTo(null);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) {
      toast.info('请输入内容');
      return;
    }
    if (content.length > 500) {
      toast.error('评论最多 500 字');
      return;
    }
    setSending(true);
    const res = await apiClient.post<CommentData>(`/api/posts/${id}/comments`, {
      content,
      parentId: replyTo?.commentId,
    });
    setSending(false);
    if (res.ok && res.data) {
      toast.success(replyTo ? '已回复' : '评论成功');
      // 顶部插入新评论（如果是顶层评论）；如果是回复，重新加载父评论的 replies 比较麻烦
      // 简单处理：reload 整个评论列表头条
      if (!replyTo) {
        setComments((prev) => [res.data!, ...prev]);
        setPost((prev) =>
          prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev
        );
      } else {
        // 回复：暂时 reload 全部刷新嵌套（简单可靠）
        load();
      }
      setDraft('');
      setReplyTo(null);
    } else {
      toast.error(res.error || '发送失败');
    }
  };

  const goAuthorProfile = () => {
    if (post) Taro.navigateTo({ url: `/pages/user-profile/index?id=${post.user.id}` });
  };

  const goEvent = () => {
    if (post?.event) {
      Taro.navigateTo({ url: `/pages/event-detail/index?id=${post.event.id}` });
    }
  };

  if (loading) {
    return (
      <View className="post-detail-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }
  if (!post) {
    return (
      <View className="post-detail-page">
        <View className="loading">帖子不存在</View>
      </View>
    );
  }

  return (
    <View className="post-detail-page">
      <ScrollView scrollY className="post-scroll" enableBackToTop>
        <View className="content-wrap">
          {/* 作者卡 */}
          <View className="author-row" onClick={goAuthorProfile}>
            <Avatar src={post.user.avatar} name={post.user.nickname} size={88} />
            <View className="author-info">
              <View className="author-name-row">
                <Text className="author-name">{post.user.nickname}</Text>
                {post.user.isVerified && <Text className="verified">已认证</Text>}
              </View>
              {post.user.bio && <Text className="author-bio">{post.user.bio}</Text>}
              <Text className="post-time">{formatTime(post.createdAt)}</Text>
            </View>
          </View>

          {/* 帖子正文 */}
          <Text className="post-content">{post.content}</Text>

          {/* 图片轮播 */}
          {post.images && post.images.length > 0 && (
            <ImageSwiper images={post.images} />
          )}

          {/* 关联活动 */}
          {post.event && (
            <Card onClick={goEvent}>
              <View className="event-link">
                <Text className="event-link-icon">🎫</Text>
                <View className="event-link-info">
                  <Text className="event-link-name">{post.event.name}</Text>
                  <Text className="event-link-meta">
                    {[post.event.date, post.event.city, post.event.venue].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text className="event-link-arrow">›</Text>
              </View>
            </Card>
          )}

          {/* 评论区 */}
          <View className="comments-section">
            <Text className="section-title">评论 ({post.commentCount})</Text>
            {comments.length === 0 ? (
              <View className="empty-comments">暂无评论，来抢沙发吧 🛋</View>
            ) : (
              comments.map((c) => (
                <CommentItem key={c.id} comment={c} onReply={handleReply} />
              ))
            )}
            {commentHasMore && (
              <View className="load-more" onClick={loadMoreComments}>
                <Text>{loadingMore ? '加载中...' : '加载更多评论'}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 互动栏 + 输入栏（fixed 底部） */}
      <View className="bottom-bar">
        {replyTo && (
          <View className="reply-hint">
            <Text className="reply-hint-text">回复 @{replyTo.nickname}</Text>
            <Text className="reply-hint-cancel" onClick={cancelReply}>取消</Text>
          </View>
        )}
        <View className="bottom-row">
          <Input
            className="comment-input"
            placeholder={replyTo ? `回复 @${replyTo.nickname}...` : '写评论...'}
            value={draft}
            onInput={(e) => setDraft(e.detail.value)}
            confirmType="send"
            onConfirm={handleSend}
            maxlength={500}
          />
          <LikeButton postId={post.id} isLiked={post.isLiked} count={post.likeCount} />
          <FavoriteButton postId={post.id} isFavorited={post.isFavorited} />
          <View
            className={`send-btn ${draft.trim() ? '' : 'disabled'}`}
            onClick={handleSend}
          >
            <Text>{sending ? '...' : '发送'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function formatTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
