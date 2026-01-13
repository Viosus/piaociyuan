"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from '@/lib/api';
import Sidebar from "@/components/Sidebar";

type VerificationRequest = {
  id: string;
  verifiedType: string;
  realName: string;
  organization?: string;
  reason: string;
  status: string;
  rejectReason?: string;
  createdAt: string;
  reviewedAt?: string;
};

export default function VerificationPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [verifiedType, setVerifiedType] = useState('celebrity');
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [organization, setOrganization] = useState('');
  const [reason, setReason] = useState('');
  const [proofImageUrls, setProofImageUrls] = useState<string>('');

  // 认证类型标签
  const verifiedTypeLabels: Record<string, string> = {
    celebrity: '明星/名人',
    artist: '艺术家',
    organizer: '主办方',
    official: '官方机构',
  };

  // 状态标签
  const statusLabels: Record<string, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已拒绝',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  // 加载申请记录
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    loadRequests();
  }, [router]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/user/verification');
      if (res.ok) {
        setRequests(res.data || []);
      }
    } catch {
      // 静默处理加载认证记录失败
    } finally {
      setLoading(false);
    }
  };

  // 提交申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!realName || !reason || !proofImageUrls) {
      alert('请填写所有必填字段');
      return;
    }

    // 解析图片URLs
    const proofImages = proofImageUrls.split('\n').filter(url => url.trim());
    if (proofImages.length === 0) {
      alert('请至少提供一张证明材料');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost('/api/user/verification', {
        verifiedType,
        realName,
        idCard: idCard || null,
        organization: organization || null,
        proofImages,
        reason,
      });

      if (res.ok) {
        alert('认证申请已提交！');
        setShowForm(false);
        // 重置表单
        setRealName('');
        setIdCard('');
        setOrganization('');
        setReason('');
        setProofImageUrls('');
        // 重新加载
        loadRequests();
      } else {
        alert(res.message || '提交失败');
      }
    } catch {
      // 静默处理提交认证申请失败
      alert('提交失败');
    } finally {
      setSubmitting(false);
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
    <div className="flex page-background">
      <Sidebar />

      <main className="flex-1 ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">身份认证</h1>
            <p className="text-gray-600">申请身份认证，获得专属认证徽章</p>
          </div>

          {/* 申请按钮 */}
          {!showForm && requests.filter(r => r.status === 'pending').length === 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                ✨ 申请认证
              </button>
            </div>
          )}

          {/* 申请表单 */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">提交认证申请</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    认证类型 *
                  </label>
                  <select
                    value={verifiedType}
                    onChange={(e) => setVerifiedType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="celebrity">明星/名人</option>
                    <option value="artist">艺术家</option>
                    <option value="organizer">主办方</option>
                    <option value="official">官方机构</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    真实姓名 *
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    身份证号（可选）
                  </label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="将加密存储"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属机构/公司（可选）
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    证明材料图片URLs *
                  </label>
                  <textarea
                    value={proofImageUrls}
                    onChange={(e) => setProofImageUrls(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={4}
                    placeholder="每行一个图片URL，例如：&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    请提供能证明您身份的材料，如工作证、演出照片、官方认证等
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    申请理由 *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={4}
                    placeholder="请说明您申请认证的理由"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? '提交中...' : '提交申请'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 申请记录列表 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">申请记录</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无申请记录</div>
            ) : (
              <div className="divide-y">
                {requests.map((request) => (
                  <div key={request.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {verifiedTypeLabels[request.verifiedType] || request.verifiedType}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
                            {statusLabels[request.status] || request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          真实姓名：{request.realName}
                          {request.organization && ` • ${request.organization}`}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">申请理由：</span>
                      {request.reason}
                    </div>

                    {request.status === 'rejected' && request.rejectReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-900">拒绝理由：</p>
                        <p className="text-sm text-red-800">{request.rejectReason}</p>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✅ 认证已通过！您现在拥有专属认证徽章。
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
