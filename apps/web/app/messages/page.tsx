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
  messageType?: string;
}

interface Conversation {
  id: string;
  type?: 'private' | 'group';
  // 私聊
  otherUser?: User;
  // 群聊
  name?: string | null;
  avatar?: string | null;
  memberCount?: number | null;
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
  }, []);

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

  const filteredConversations = conversations.filter((conv) => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    if (conv.type === 'group') {
      return (conv.name || '').toLowerCase().includes(term);
    }
    return (conv.otherUser?.nickname || '').toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen -mt-20">
      {/* Header - fixed 占满 layout 主区顶部，跟 /messages/[id] 一致 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#FFEBF5] fixed top-0 left-20 right-[var(--right-sidebar-width,64px)] z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#46467A] via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#46467A]" />
              私信
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/messages/new')}
                className="flex items-center gap-1 px-3 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] transition text-sm"
                title="新建私聊"
              >
                <Plus className="w-4 h-4" />
                私聊
              </button>
              <button
                onClick={() => router.push('/messages/groups/new')}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-[#46467A]/30 text-[#46467A] rounded-lg hover:bg-[#46467A]/5 transition text-sm"
                title="创建群聊"
              >
                <Plus className="w-4 h-4" />
                群聊
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a1a1f]/60" />
            <input
              type="text"
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#FFEBF5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] text-[#1a1a1f]"
            />
          </div>
        </div>
      </div>

      {/* Conversations List - pt 给上面 fixed header 让位（约 132px）*/}
      <div className="max-w-4xl mx-auto px-4 pt-36 pb-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#46467A] mx-auto mb-4"></div>
            <p className="text-white/60">加载中...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
            <MessageSquare className="w-16 h-16 mx-auto text-[#46467A]/60 mb-4" />
            <p className="text-[#1a1a1f] mb-4">
              {searchQuery ? '没有找到匹配的对话' : '还没有对话'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/messages/new')}
                className="mt-4 px-6 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] transition"
              >
                发起对话
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const isGroup = conversation.type === 'group';
              const lastMsg = conversation.lastMessage;
              // image 消息预览：直接显示"[图片]"，content 是 URL 不应展示
              const lastMsgPreview = lastMsg
                ? lastMsg.messageType === 'image'
                  ? '[图片]'
                  : lastMsg.content
                : '开始对话...';

              return (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/messages/${conversation.id}`)}
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-4 hover:bg-white hover:shadow-lg cursor-pointer transition border border-[#FFEBF5] hover:border-[#FFE3F0]"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {isGroup ? (
                      // 群聊头像：默认占位 / 自定义头像；点击不跳用户主页
                      <div className="relative flex-shrink-0">
                        {conversation.avatar ? (
                          <Image
                            src={conversation.avatar}
                            alt={conversation.name || '群聊'}
                            width={48}
                            height={48}
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl">
                            👥
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#46467A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    ) : (
                      // 私聊头像：点击跳对方主页
                      <div
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (conversation.otherUser?.id) {
                            router.push(`/u/${conversation.otherUser.id}`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (conversation.otherUser?.id) {
                              router.push(`/u/${conversation.otherUser.id}`);
                            }
                          }
                        }}
                        className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                      >
                        {conversation.otherUser?.avatar ? (
                          <Image
                            src={conversation.otherUser.avatar}
                            alt={conversation.otherUser.nickname || '用户'}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-[#46467A] to-[#E0DFFD] rounded-full flex items-center justify-center text-white font-bold">
                            {conversation.otherUser?.nickname?.charAt(0) || '?'}
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#46467A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-semibold text-[#1a1a1f] truncate">
                            {isGroup
                              ? conversation.name || '群聊'
                              : conversation.otherUser?.nickname || '未知用户'}
                          </h3>
                          {isGroup && (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                              {conversation.memberCount || 0} 人
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#1a1a1f]/60 flex-shrink-0 ml-2">
                          {lastMsg && formatTime(lastMsg.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          conversation.unreadCount > 0
                            ? 'text-[#1a1a1f] font-medium'
                            : 'text-[#1a1a1f]/60'
                        }`}
                      >
                        {lastMsgPreview}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
