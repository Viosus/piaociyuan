"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from '@/lib/api';

type VerificationRequest = {
  id: string;
  userId: string;
  verifiedType: string;
  realName: string;
  idCard?: string;
  organization?: string;
  proofImages: string;
  reason: string;
  status: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
  user: {
    id: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
};

type VerificationsResponse = {
  ok: boolean;
  data?: {
    requests: VerificationRequest[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function VerificationsManagement() {
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'celebrity' | 'artist' | 'organizer' | 'official'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 审核表单
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verificationBadge, setVerificationBadge] = useState('');

  // 认证类型标签
  const verifiedTypeLabels: Record<string, string> = {
    celebrity: '明星/名人',
    artist: '艺术家',
    organizer: '主办方',
    official: '官方机构',
  };

  // 状态标签
  const statusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  // 加载申请列表
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/verifications?status=${statusFilter}&verifiedType=${typeFilter}&page=${page}&pageSize=20`
      ) as VerificationsResponse;
      if (res.ok && res.data) {
        setRequests(res.data.requests);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch (error) {
      console.error('加载认证申请失败:', error);
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

    loadRequests();
  }, [statusFilter, typeFilter, page, router]);

  // 审核认证
  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert('请填写拒绝理由');
      return;
    }

    if (!confirm(`确定要${action === 'approve' ? '批准' : '拒绝'}该申请吗？`)) {
      return;
    }

    setProcessing(requestId);
    try {
      const res = await apiPatch(`/api/admin/verifications/${requestId}`, {
        action,
        rejectReason: action === 'reject' ? rejectReason : undefined,
        verificationBadge: action === 'approve' ? verificationBadge || undefined : undefined,
      });

      if (res.ok) {
        alert(action === 'approve' ? '已批准认证' : '已拒绝认证');
        setReviewingId(null);
        setRejectReason('');
        setVerificationBadge('');
        loadRequests();
      } else {
        alert(res.message || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败');
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
            <h1 className="text-2xl font-bold text-gray-900">认证审核</h1>
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
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                全部
              </button>
              <button
                onClick={() => { setStatusFilter('pending'); setPage(1); }}
                className={`px-4 py-2 rounded ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                待审核
              </button>
              <button
                onClick={() => { setStatusFilter('approved'); setPage(1); }}
                className={`px-4 py-2 rounded ${statusFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                已通过
              </button>
              <button
                onClick={() => { setStatusFilter('rejected'); setPage(1); }}
                className={`px-4 py-2 rounded ${statusFilter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                已拒绝
              </button>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
              className="px-4 py-2 border rounded"
            >
              <option value="all">所有类型</option>
              <option value="celebrity">明星/名人</option>
              <option value="artist">艺术家</option>
              <option value="organizer">主办方</option>
              <option value="official">官方机构</option>
            </select>
          </div>
        </div>

        {/* 申请列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无认证申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                {/* 用户信息和状态 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={request.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                      alt="用户头像"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.user.nickname || '匿名用户'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.user.phone || request.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {verifiedTypeLabels[request.verifiedType]}
                    </span>
                  </div>
                </div>

                {/* 申请信息 */}
                <div className="mb-4 space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">真实姓名：</span>{request.realName}
                  </p>
                  {request.organization && (
                    <p className="text-gray-700">
                      <span className="font-medium">所属机构：</span>{request.organization}
                    </p>
                  )}
                  {request.idCard && (
                    <p className="text-gray-700">
                      <span className="font-medium">身份证号：</span>{request.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <span className="font-medium">申请理由：</span>{request.reason}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">申请时间：</span>{formatDate(request.createdAt)}
                  </p>
                </div>

                {/* 证明材料 */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">证明材料：</p>
                  <div className="flex gap-2 flex-wrap">
                    {JSON.parse(request.proofImages).map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-24 h-24 border rounded overflow-hidden hover:opacity-80"
                      >
                        <img src={url} alt="证明材料" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* 已处理信息 */}
                {request.status !== 'pending' && (
                  <div className={`p-3 rounded-lg mb-4 ${request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {request.status === 'approved' && (
                      <p className="text-sm text-green-800">✅ 已通过认证</p>
                    )}
                    {request.status === 'rejected' && request.rejectReason && (
                      <div className="text-sm">
                        <p className="font-medium text-red-900">拒绝理由：</p>
                        <p className="text-red-800">{request.rejectReason}</p>
                      </div>
                    )}
                    {request.reviewedAt && (
                      <p className="text-xs text-gray-600 mt-1">
                        审核时间：{formatDate(request.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                {request.status === 'pending' && (
                  <>
                    {reviewingId === request.id ? (
                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              拒绝理由（拒绝时填写）
                            </label>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                              rows={3}
                              placeholder="请填写拒绝理由"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              认证徽章URL（通过时可选填）
                            </label>
                            <input
                              type="text"
                              value={verificationBadge}
                              onChange={(e) => setVerificationBadge(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(request.id, 'approve')}
                              disabled={processing === request.id}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              批准认证
                            </button>
                            <button
                              onClick={() => handleReview(request.id, 'reject')}
                              disabled={processing === request.id}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              拒绝申请
                            </button>
                            <button
                              onClick={() => {
                                setReviewingId(null);
                                setRejectReason('');
                                setVerificationBadge('');
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewingId(request.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          审核
                        </button>
                      </div>
                    )}
                  </>
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
