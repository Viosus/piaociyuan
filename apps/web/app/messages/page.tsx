'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface User {
  id: string;
  nickname: string;
  avatar: string | null;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  otherUser: User;
  lastMessage?: LastMessage;
  unreadCount: number;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?returnUrl=/messages');
      return;
    }
    loadConversations();
  }, [router]);

  const loadConversations = async () => {
    try {
      const data = await apiGet('/api/messages/conversations');
      setConversations(data);
    } catch {
      // 静默处理加载对话列表失败
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#FFEBF5] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#EAF353]" />
              私信
            </h1>
            <button
              onClick={() => router.push('/messages/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] transition"
            >
              <Plus className="w-4 h-4" />
              新建对话
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#282828]/60" />
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#FFEBF5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] text-[#282828]"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EAF353] mx-auto mb-4"></div>
            <p className="text-white/60">加载中...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
            <MessageSquare className="w-16 h-16 mx-auto text-[#EAF353]/60 mb-4" />
            <p className="text-[#282828] mb-4">
              {searchQuery ? '没有找到匹配的对话' : '还没有对话'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/messages/new')}
                className="mt-4 px-6 py-2 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] transition"
              >
                发起对话
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => router.push(`/messages/${conversation.id}`)}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:bg-white hover:shadow-lg cursor-pointer transition border border-[#FFEBF5] hover:border-[#FFE3F0]"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conversation.otherUser?.avatar ? (
                      <Image
                        src={conversation.otherUser.avatar}
                        alt={conversation.otherUser.nickname || '用户'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-[#EAF353] rounded-full flex items-center justify-center text-white font-bold">
                        {conversation.otherUser?.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                    {/* Unread badge */}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-[#EAF353] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[#282828] truncate">
                        {conversation.otherUser?.nickname || '未知用户'}
                      </h3>
                      <span className="text-xs text-[#282828]/60 flex-shrink-0 ml-2">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        conversation.unreadCount > 0
                          ? 'text-[#282828] font-medium'
                          : 'text-[#282828]/60'
                      }`}
                    >
                      {conversation.lastMessage?.content || '开始对话...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
