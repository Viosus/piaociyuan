"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from '@/lib/api';

type Report = {
  id: string;
  postId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
  };
  post: {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      nickname?: string;
      avatar?: string;
    };
  };
};

type ReportsResponse = {
  ok: boolean;
  data?: {
    reports: Report[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function ReportsManagement() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载举报列表
  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/admin/reports?status=${statusFilter}&page=${page}&pageSize=20`) as ReportsResponse;
      if (res.ok && res.data) {
        setReports(res.data.reports);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch {
      // 静默处理加载举报列表失败
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

    loadReports();
  }, [statusFilter, page, router]);

  // 处理举报
  const handleReport = async (reportId: string, action: 'approve' | 'reject', hidePost = false) => {
    if (!confirm(`确定要${action === 'approve' ? '批准' : '拒绝'}该举报吗？`)) {
      return;
    }

    setProcessing(reportId);
    try {
      const res = await apiPatch(`/api/admin/reports/${reportId}`, {
        action,
        hidePost,
      });

      if (res.ok) {
        alert(action === 'approve' ? '已批准举报' : '已拒绝举报');
        // 重新加载列表
        loadReports();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      // 静默处理处理举报失败
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  // 状态标签样式
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">举报管理</h1>
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
          <div className="flex gap-2">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              全部
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              待处理
            </button>
            <button
              onClick={() => { setStatusFilter('approved'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              已批准
            </button>
            <button
              onClick={() => { setStatusFilter('rejected'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              已拒绝
            </button>
          </div>
        </div>

        {/* 举报列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无举报记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={report.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt="举报人头像"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {report.user.nickname || '匿名用户'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {/* 举报原因 */}
                <div className="mb-4 p-3 bg-red-50 rounded">
                  <p className="text-sm font-semibold text-red-900 mb-1">举报原因：</p>
                  <p className="text-sm text-red-800">{report.reason}</p>
                </div>

                {/* 被举报的帖子 */}
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={report.post.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt="发帖人头像"
                      className="w-8 h-8 rounded-full"
                    />
                    <p className="text-sm font-medium text-gray-900">
                      {report.post.user.nickname || '匿名用户'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(report.post.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {report.post.content}
                  </p>
                  <button
                    onClick={() => router.push(`/encore/${report.postId}`)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    查看完整帖子 →
                  </button>
                </div>

                {/* 操作按钮 */}
                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReport(report.id, 'approve', true)}
                      disabled={processing === report.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      批准并隐藏帖子
                    </button>
                    <button
                      onClick={() => handleReport(report.id, 'approve', false)}
                      disabled={processing === report.id}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      批准（保留帖子）
                    </button>
                    <button
                      onClick={() => handleReport(report.id, 'reject')}
                      disabled={processing === report.id}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      拒绝举报
                    </button>
                  </div>
                )}
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
