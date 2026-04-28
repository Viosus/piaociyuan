"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch, apiPut, apiDelete } from '@/lib/api';

type User = {
  id: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  role: string;
  isBanned?: boolean;
  bannedReason?: string;
  isVerified: boolean;
  verifiedType?: string;
  followerCount: number;
  followingCount: number;
  createdAt: string;
  _count: {
    posts: number;
    orders: number;
    tickets: number;
  };
};

type UsersResponse = {
  ok: boolean;
  data?: {
    users: User[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banDialogUser, setBanDialogUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/admin/users?role=${roleFilter}&search=${search}&page=${page}&pageSize=20`
      ) as UsersResponse;
      if (res.ok && res.data) {
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        alert('加载失败');
      }
    } catch {
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
    loadUsers();
  }, [roleFilter, search, page, router]);

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin' | 'staff') => {
    if (!confirm(`确定要将该用户设为${newRole === 'admin' ? '管理员' : newRole === 'staff' ? '工作人员' : '普通用户'}吗？`)) {
      return;
    }
    setProcessing(userId);
    try {
      const res = await apiPatch(`/api/admin/users/${userId}`, { role: newRole });
      if (res.ok) {
        alert('角色已更新');
        loadUsers();
      } else {
        alert(res.message || '操作失败');
      }
    } catch {
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleBan = async () => {
    if (!banDialogUser) return;
    setProcessing(banDialogUser.id);
    try {
      const res = await apiPut(`/api/admin/users/${banDialogUser.id}`, {
        action: 'ban',
        reason: banReason || '违反社区规定',
      });
      if (res.ok) {
        alert('用户已封禁');
        setBanDialogUser(null);
        setBanReason('');
        loadUsers();
      } else {
        alert(res.message || '封禁失败');
      }
    } catch {
      alert('封禁失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('确定要解封该用户吗？')) return;
    setProcessing(userId);
    try {
      const res = await apiPut(`/api/admin/users/${userId}`, { action: 'unban' });
      if (res.ok) {
        alert('用户已解封');
        loadUsers();
      } else {
        alert(res.message || '解封失败');
      }
    } catch {
      alert('解封失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;
    setProcessing(userId);
    try {
      const res = await apiDelete(`/api/admin/users/${userId}`);
      if (res.ok) {
        alert('用户已删除');
        loadUsers();
      } else {
        alert(res.message || '删除失败');
      }
    } catch {
      alert('删除失败');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="page-background">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              返回管理后台
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => { setRoleFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded ${roleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                全部
              </button>
              <button
                onClick={() => { setRoleFilter('user'); setPage(1); }}
                className={`px-4 py-2 rounded ${roleFilter === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                普通用户
              </button>
              <button
                onClick={() => { setRoleFilter('admin'); setPage(1); }}
                className={`px-4 py-2 rounded ${roleFilter === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                管理员
              </button>
            </div>
            <input
              type="text"
              placeholder="搜索用户（昵称、邮箱、手机号）"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 px-4 py-2 border rounded"
            />
          </div>
        </div>

        {/* 用户列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">暂无用户</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色/状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">统计</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={user.isBanned ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                          alt="头像"
                          className={`w-10 h-10 rounded-full ${user.isBanned ? 'grayscale opacity-50' : ''}`}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nickname || '未设置昵称'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone || user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block w-fit px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理员' : user.role === 'staff' ? '工作人员' : '普通用户'}
                        </span>
                        {user.isBanned && (
                          <span className="inline-block w-fit px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            已封禁
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        帖子: {user._count.posts} | 订单: {user._count.orders}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 flex-wrap">
                        {/* 角色操作 */}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleUpdateRole(user.id, 'user')}
                            disabled={processing === user.id}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            取消管理员
                          </button>
                        )}
                        {user.role === 'user' && (
                          <button
                            onClick={() => handleUpdateRole(user.id, 'staff')}
                            disabled={processing === user.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            设为工作人员
                          </button>
                        )}
                        {user.role === 'staff' && (
                          <button
                            onClick={() => handleUpdateRole(user.id, 'user')}
                            disabled={processing === user.id}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            取消工作人员
                          </button>
                        )}

                        {/* 封禁/解封 */}
                        {user.role !== 'admin' && (
                          user.isBanned ? (
                            <button
                              onClick={() => handleUnban(user.id)}
                              disabled={processing === user.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              解封
                            </button>
                          ) : (
                            <button
                              onClick={() => { setBanDialogUser(user); setBanReason(''); }}
                              disabled={processing === user.id}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            >
                              封禁
                            </button>
                          )
                        )}

                        {/* 删除 */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={processing === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* 封禁原因弹窗 */}
      {banDialogUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                封禁用户「{banDialogUser.nickname || banDialogUser.phone || '未知'}」
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">封禁原因</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="请输入封禁原因（如：违反社区规定）"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setBanDialogUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBan}
                  disabled={processing === banDialogUser.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  确认封禁
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
