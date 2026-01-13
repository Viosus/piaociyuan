'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Search, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface User {
  id: string;
  nickname: string;
  avatar: string | null;
  phone: string;
}

export default function NewConversationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?returnUrl=/messages/new');
    }
  }, [router]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await apiGet(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch {
      // 静默处理搜索失败
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (userId: string) => {
    setCreating(true);
    try {
      const data = await apiPost('/api/messages/conversations', { otherUserId: userId });
      router.push(`/messages/${data.id}`);
    } catch (error: any) {
      // 静默处理创建对话失败
      alert(error?.error || '创建对话失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#C72471]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#FFEBF5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/messages')}
              className="p-2 hover:bg-[#FFF9FC] rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-[#282828]" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent">新建对话</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#282828]/60" />
            <input
              type="text"
              placeholder="搜索用户（昵称或手机号）..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#FFEBF5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] text-[#282828]"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {searching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EAF353] mx-auto mb-4"></div>
            <p className="text-white/60">搜索中...</p>
          </div>
        ) : searchQuery.length < 2 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
            <MessageSquare className="w-16 h-16 mx-auto text-[#EAF353]/60 mb-4" />
            <p className="text-[#282828]/60">输入至少2个字符开始搜索</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
            <MessageSquare className="w-16 h-16 mx-auto text-[#EAF353]/60 mb-4" />
            <p className="text-[#282828]/60">没有找到匹配的用户</p>
          </div>
        ) : (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:bg-white hover:shadow-lg transition border border-[#FFEBF5] hover:border-[#FFE3F0]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.nickname || '用户'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-[#EAF353] rounded-full flex items-center justify-center text-white font-bold">
                        {user.nickname?.charAt(0) || '?'}
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-[#282828]">{user.nickname || '未知用户'}</h3>
                      <p className="text-sm text-[#282828]/60">{user.phone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => startConversation(user.id)}
                    disabled={creating}
                    className="px-4 py-2 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {creating ? '创建中...' : '发起对话'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
