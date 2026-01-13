"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FavoriteButton from "@/app/encore/ui/FavoriteButton";

type PostDetail = {
  id: string;
  content: string;
  location?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
    bio?: string;
    isVerified: boolean;
    verifiedType?: string;
  };
  event?: {
    id: number;
    name: string;
    city: string;
    venue: string;
    date: string;
    time: string;
    cover: string;
  };
  images: {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
  }[];
  comments: {
    id: string;
    content: string;
    likeCount: number;
    createdAt: string;
    user: {
      id: string;
      nickname: string;
      avatar?: string;
    };
    replies: {
      id: string;
      content: string;
      likeCount: number;
      createdAt: string;
      user: {
        id: string;
        nickname: string;
        avatar?: string;
      };
    }[];
  }[];
};

export default function PostDetailClient({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    loadPost();
    checkLikeStatus();
  }, [postId]);

  // 当post加载完成后检查关注状态
  useEffect(() => {
    if (post) {
      checkFollowStatus();
    }
  }, [post]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/posts/${postId}`, { headers });
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || "加载失败");
      }

      setPost(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/posts/${postId}/like`, {
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

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !post) return;

      const res = await fetch(`/api/users/${post.user.id}/follow`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setIsFollowing(data.data.isFollowing);
        }
      }
    } catch {
      // 静默处理检查关注状态失败
    }
  };

  const handleLike = async () => {
    // 防止重复点击
    if (isLiking) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setIsLiking(true);

      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '操作失败');
      }

      // 更新点赞状态
      setIsLiked(data.data.isLiked);
      if (post) {
        setPost({
          ...post,
          likeCount: data.data.likeCount,
        });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async () => {
    if (!post) return;

    // 防止重复点击
    if (isFollowLoading) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setIsFollowLoading(true);

      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${post.user.id}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '操作失败');
      }

      // 更新关注状态
      setIsFollowing(data.data.isFollowing);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.content.substring(0, 50),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板");
    }
  };

  const handleReport = async () => {
    setShowMoreMenu(false);

    const reason = prompt('请输入举报原因：');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const res = await fetch(`/api/posts/${postId}/report`, {
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

      alert('举报成功，我们会尽快处理');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '举报失败');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      alert('请输入评论内容');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setIsSubmittingComment(true);

      const res = await fetch(`/api/posts/${postId}/comments`, {
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

      // 清空输入框
      setCommentText('');

      // 刷新帖子数据（包括评论）
      await loadPost();

      alert('评论成功');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '评论失败');
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

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "帖子不存在"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">返回</span>
          </button>

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* 下拉菜单 */}
            {showMoreMenu && (
              <>
                {/* 遮罩层 */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                {/* 菜单 */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    举报
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* 左侧：图片区域 */}
          <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] bg-black flex items-center justify-center">
            {post.images.length > 0 ? (
              <div className="relative w-full h-full">
                <img
                  src={post.images[currentImageIndex].imageUrl}
                  alt={post.content.substring(0, 50)}
                  className="w-full h-full object-contain"
                />

                {/* 图片指示器 */}
                {post.images.length > 1 && (
                  <>
                    {/* 左右切换按钮 */}
                    {currentImageIndex > 0 && (
                      <button
                        onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    {currentImageIndex < post.images.length - 1 && (
                      <button
                        onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {/* 图片计数 */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                      {currentImageIndex + 1} / {post.images.length}
                    </div>

                    {/* 缩略图导航 */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {post.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex
                              ? "bg-white w-8"
                              : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white/60">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>无图片</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：内容区域 */}
          <div className="bg-white">
            {/* 用户信息 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.nickname}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {post.user.nickname[0]}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {post.user.nickname}
                      </span>
                      {post.user.isVerified && (
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    {post.user.bio && (
                      <p className="text-xs text-gray-500 mt-0.5">{post.user.bio}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isFollowLoading ? '处理中...' : isFollowing ? '已关注' : '关注'}
                </button>
              </div>
            </div>

            {/* 帖子内容 */}
            <div className="p-4 border-b border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>

              {/* 位置信息 */}
              {post.location && (
                <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{post.location}</span>
                </div>
              )}

              {/* 发布时间 */}
              <div className="mt-2 text-xs text-gray-400">
                {formatDate(post.createdAt)}
              </div>
            </div>

            {/* 关联活动 */}
            {post.event && (
              <Link
                href={`/events/${post.event.id}`}
                className="block p-4 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={post.event.cover}
                    alt={post.event.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {post.event.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {post.event.city} · {post.event.venue}
                    </p>
                    <p className="text-xs text-gray-500">
                      {post.event.date} {post.event.time}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            )}

            {/* 互动数据 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>{post.viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{post.likeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{post.commentCount}</span>
              </div>
            </div>

            {/* 评论列表 */}
            <div className="divide-y divide-gray-200">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  评论 ({post.commentCount})
                </h3>

                {post.comments.length > 0 ? (
                  <div className="space-y-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        {/* 主评论 */}
                        <div className="flex items-start gap-3">
                          {comment.user.avatar ? (
                            <img
                              src={comment.user.avatar}
                              alt={comment.user.nickname}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {comment.user.nickname[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.user.nickname}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>

                            {/* 回复 */}
                            {comment.replies.length > 0 && (
                              <div className="mt-2 ml-4 space-y-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    {reply.user.avatar ? (
                                      <img
                                        src={reply.user.avatar}
                                        alt={reply.user.nickname}
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {reply.user.nickname[0]}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-medium text-gray-900">
                                        {reply.user.nickname}
                                      </span>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button className="text-gray-400 hover:text-red-500 transition flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>还没有评论，快来抢沙发吧</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部互动栏（固定） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <input
            type="text"
            placeholder="说点什么..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            disabled={isSubmittingComment}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          />

          <button
            onClick={handleSubmitComment}
            disabled={isSubmittingComment || !commentText.trim()}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingComment ? '发送中...' : '发送'}
          </button>

          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLiked
                ? "text-red-500 scale-100"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50 hover:scale-110"
            } ${isLiking ? 'animate-pulse' : ''}`}
            title={isLiked ? '取消点赞' : '点赞'}
          >
            {isLiking ? (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <svg
                className={`w-6 h-6 transition-transform ${isLiked ? 'scale-110' : ''}`}
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </button>

          <FavoriteButton postId={postId} />

          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="分享"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
