"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch, apiDelete } from '@/lib/api';

type Post = {
  id: string;
  content: string;
  userId: string;
  eventId?: number;
  location?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isVisible: boolean;
  createdAt: string;
  user: {
    id: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
  };
  event?: {
    id: number;
    name: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
  }>;
  _count: {
    likes: number;
    comments: number;
    reports: number;
  };
};

type PostsResponse = {
  ok: boolean;
  data?: {
    posts: Post[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function PostsManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载帖子列表
  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/posts?visibility=${visibilityFilter}&search=${search}&page=${page}&pageSize=20`
      ) as PostsResponse;
      if (res.ok && res.data) {
        setPosts(res.data.posts);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch {
      // 静默处理加载帖子列表失败
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadPosts();
  }, [visibilityFilter, search, page, router]);

  // 切换帖子可见性
  const handleToggleVisibility = async (postId: string, isVisible: boolean) => {
    setProcessing(postId);
    try {
      const res = await apiPatch(`/api/admin/posts/${postId}`, { isVisible });
      if (res.ok) {
        alert(isVisible ? '帖子已显示' : '帖子已隐藏');
        loadPosts();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      // 静默处理切换帖子可见性失败
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  // 删除帖子
  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除该帖子吗？此操作不可恢复！')) {
      return;
    }

    setProcessing(postId);
    try {
      const res = await apiDelete(`/api/admin/posts/${postId}`);
      if (res.ok) {
        alert('帖子已删除');
        loadPosts();
      } else {
        alert(res.message || '删除失败');
      }
    } catch {
      // 静默处理删除帖子失败
      alert('删除失败');
    } finally {
      setProcessing(null);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-background">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">帖子管理</h1>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              返回管理后台
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => { setVisibilityFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded ${visibilityFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                全部
              </button>
              <button
                onClick={() => { setVisibilityFilter('visible'); setPage(1); }}
                className={`px-4 py-2 rounded ${visibilityFilter === 'visible' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                可见
              </button>
              <button
                onClick={() => { setVisibilityFilter('hidden'); setPage(1); }}
                className={`px-4 py-2 rounded ${visibilityFilter === 'hidden' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                已隐藏
              </button>
            </div>
            <input
              type="text"
              placeholder="搜索帖子内容"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 px-4 py-2 border rounded"
            />
          </div>
        </div>

        {/* 帖子列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无帖子</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt="用户头像"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {post.user.nickname || '匿名用户'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      post.isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {post.isVisible ? '可见' : '已隐藏'}
                    </span>
                    {post._count.reports > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {post._count.reports} 个举报
                      </span>
                    )}
                  </div>
                </div>

                {/* 帖子内容 */}
                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">{post.content}</p>
                  {post.images.length > 0 && (
                    <div className="mt-2">
                      <img
                        src={post.images[0].imageUrl}
                        alt="帖子图片"
                        className="w-32 h-32 object-cover rounded"
                      />
                    </div>
                  )}
                  {post.event && (
                    <div className="mt-2 text-sm text-blue-600">
                      关联活动：{post.event.name}
                    </div>
                  )}
                </div>

                {/* 统计信息 */}
                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <span>👁️ {post.viewCount} 浏览</span>
                  <span>❤️ {post._count.likes} 点赞</span>
                  <span>💬 {post._count.comments} 评论</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/encore/${post.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    查看详情
                  </button>
                  {post.isVisible ? (
                    <button
                      onClick={() => handleToggleVisibility(post.id, false)}
                      disabled={processing === post.id}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      隐藏帖子
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleVisibility(post.id, true)}
                      disabled={processing === post.id}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      显示帖子
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={processing === post.id}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    删除帖子
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 bg-white rounded shadow">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
