'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { formatMessageTime, shouldShowTimeDivider } from '@/lib/time';
import { useToast } from '@/components/Toast';

interface User {
  id: string;
  nickname: string;
  avatar: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: User;
  conversationId?: string;
}

type LocalMessage = Message & {
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
};

interface ConversationData {
  id: string;
  otherUser: User;
  messages: Message[];
  messageTotal: number;
  pageSize: number;
}

const MESSAGES_PAGE_SIZE = 50;
const SCROLL_BOTTOM_THRESHOLD = 80;

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderPageLoaded, setOlderPageLoaded] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  const { isConnected, getSocket } = useSocket({ autoConnect: true });

  // 拉取当前用户 id（决定消息气泡左右）
  useEffect(() => {
    apiGet('/api/auth/me')
      .then((data) => {
        if (data.ok) {
          setCurrentUserId(data.data.id);
        }
      })
      .catch(() => {
        // 登录态过期由 apiGet 处理重定向
      });
  }, []);

  // 初次进入：检查登录 + 加载对话
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(
        '/auth/login?returnUrl=' + encodeURIComponent(`/messages/${conversationId}`)
      );
      return;
    }
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, router]);

  // 收到新消息时仅当用户已在底部才自动滚到底（不打断回看历史）
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // 监听对话内的滚动，更新"是否在底部"标志
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isAtBottomRef.current = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [conversation]);

  // WebSocket 实时新消息
  useEffect(() => {
    if (!isConnected || !conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (incoming: Message & { isSelfEcho?: boolean }) => {
      if (incoming.conversationId !== conversationId) return;

      setMessages((prev) => {
        // 跳过自己发的回声（已在乐观 list 里替换）
        if (prev.some((m) => m.id === incoming.id)) return prev;
        if (incoming.isSelfEcho) {
          // 找到对应 sending 的乐观消息（content 匹配），替换之
          const idx = prev.findIndex(
            (m) =>
              m.status === 'sending' &&
              m.senderId === incoming.senderId &&
              m.content === incoming.content
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...incoming, status: 'sent' };
            return next;
          }
        }
        return [...prev, { ...incoming, status: 'sent' }];
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, conversationId, getSocket]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data: ConversationData = await apiGet(
        `/api/messages/conversations/${conversationId}`
      );
      setConversation(data);
      setMessages(data.messages.map((m) => ({ ...m, status: 'sent' as const })));
      setHasMoreOlder(data.messageTotal > data.messages.length);
      setOlderPageLoaded(1);
      // 进入会话默认滚到底
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isAtBottomRef.current = true;
      });
    } catch {
      router.push('/messages');
    } finally {
      setLoading(false);
    }
  };

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreOlder) return;
    const nextPage = olderPageLoaded + 1;

    // 记录滚动锚点，加载完后保持视觉位置不变
    const el = scrollContainerRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    try {
      setLoadingOlder(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages?page=${nextPage}&limit=${MESSAGES_PAGE_SIZE}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error('加载更早消息失败');
      const olderDesc: Message[] = await res.json();
      // /messages 返回 desc，需要 reverse 成 asc 后 prepend
      const olderAsc = olderDesc.slice().reverse();
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [
          ...olderAsc
            .filter((m) => !seen.has(m.id))
            .map((m) => ({ ...m, status: 'sent' as const })),
          ...prev,
        ];
        return merged;
      });
      setOlderPageLoaded(nextPage);

      // 是否还有更早
      if (conversation) {
        // 已加载消息数 >= total → 没有更早了
        const loadedNow = (messages.length || 0) + olderAsc.length;
        setHasMoreOlder(loadedNow < conversation.messageTotal);
      }

      // 锚点恢复滚动位置
      requestAnimationFrame(() => {
        if (el) {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        }
      });
    } catch {
      toast.error('加载更早消息失败');
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMoreOlder, olderPageLoaded, conversationId, conversation, messages.length, toast]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || !conversation || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      tempId,
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUserId ?? '',
      sender: {
        id: currentUserId ?? '',
        nickname: '我',
        avatar: null,
      },
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    isAtBottomRef.current = true;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('发送失败');
      const real: Message = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...real, status: 'sent' as const } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...m, status: 'failed' as const } : m
        )
      );
      toast.error('发送失败，点击 ↻ 重试');
    } finally {
      setSending(false);
    }
  };

  const retrySend = async (failed: LocalMessage) => {
    if (!failed.tempId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.tempId === failed.tempId ? { ...m, status: 'sending' as const } : m
      )
    );
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: failed.content }),
      });
      if (!res.ok) throw new Error('重试失败');
      const real: Message = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === failed.tempId ? { ...real, status: 'sent' as const } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === failed.tempId ? { ...m, status: 'failed' as const } : m
        )
      );
      toast.error('仍然失败，请检查网络');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // textarea 自动高度
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0DFFD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#46467A] mx-auto mb-4"></div>
          <p className="text-[#1a1a1f]/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#E0DFFD] flex flex-col -mt-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#FFEBF5] px-4 py-3 flex items-center gap-3 fixed top-0 left-20 right-[var(--right-sidebar-width,64px)] z-50">
        <button
          onClick={() => router.push('/messages')}
          className="p-2 hover:bg-white/90 rounded-lg transition"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-[#1a1a1f]" />
        </button>

        <Link
          href={`/u/${conversation.otherUser?.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          {conversation.otherUser?.avatar ? (
            <Image
              src={conversation.otherUser.avatar}
              alt={conversation.otherUser.nickname || '用户'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-[#46467A] to-[#E0DFFD] rounded-full flex items-center justify-center text-white font-bold">
              {conversation.otherUser?.nickname?.charAt(0) || '?'}
            </div>
          )}

          <div>
            <h1 className="font-semibold text-[#1a1a1f]">
              {conversation.otherUser?.nickname || '未知用户'}
            </h1>
          </div>
        </Link>
      </div>

      {/* 消息列表 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 mt-16">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 加载更早消息按钮 */}
          {hasMoreOlder && (
            <div className="text-center pb-2">
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="px-4 py-1.5 text-xs text-[#46467A] hover:bg-white/60 rounded-full border border-white/40 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loadingOlder ? (
                  <>
                    <span className="w-3 h-3 border border-[#46467A] border-t-transparent rounded-full animate-spin"></span>
                    加载中...
                  </>
                ) : (
                  '加载更早消息'
                )}
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
              <p className="text-[#1a1a1f]/60">还没有消息，发送第一条消息开始对话吧</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser =
                currentUserId !== null && msg.senderId === currentUserId;
              const showAvatar =
                index === 0 || messages[index - 1]?.senderId !== msg.senderId;
              const showTimeDivider =
                index === 0 ||
                shouldShowTimeDivider(messages[index - 1].createdAt, msg.createdAt);

              return (
                <div key={msg.id}>
                  {showTimeDivider && (
                    <div className="text-center my-3">
                      <span className="text-xs text-[#1a1a1f]/40 bg-white/40 px-3 py-1 rounded-full">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 w-10">
                      {showAvatar && !isCurrentUser && (
                        <>
                          {msg.sender.avatar ? (
                            <Image
                              src={msg.sender.avatar}
                              alt={msg.sender.nickname}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-[#46467A] to-[#E0DFFD] rounded-full flex items-center justify-center text-white font-bold">
                              {msg.sender.nickname?.charAt(0) || '?'}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                      {showAvatar && (
                        <div
                          className={`text-xs text-[#1a1a1f]/60 mb-1 ${
                            isCurrentUser ? 'text-right' : ''
                          }`}
                        >
                          {isCurrentUser ? '我' : msg.sender.nickname}
                        </div>
                      )}
                      <div
                        className={`relative rounded-lg px-4 py-2 break-words whitespace-pre-wrap ${
                          isCurrentUser
                            ? 'bg-[#46467A] text-white ml-auto'
                            : 'bg-white/80 backdrop-blur-sm text-[#1a1a1f] border border-[#FFEBF5]'
                        } ${msg.status === 'sending' ? 'opacity-60' : ''} ${
                          msg.status === 'failed' ? 'ring-1 ring-red-400' : ''
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* 状态指示 */}
                      {isCurrentUser && msg.status === 'sending' && (
                        <div className="text-[10px] text-[#1a1a1f]/40 text-right mt-0.5">
                          发送中...
                        </div>
                      )}
                      {isCurrentUser && msg.status === 'failed' && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <span className="text-[10px] text-red-500">发送失败</span>
                          <button
                            type="button"
                            onClick={() => retrySend(msg)}
                            className="text-red-500 hover:text-red-700"
                            aria-label="重试"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isCurrentUser && <div className="flex-shrink-0 w-10" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区 */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-[#FFEBF5] px-4 py-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息（Shift+Enter 换行）"
            rows={1}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-white border border-[#FFEBF5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] disabled:bg-gray-100 text-[#1a1a1f] resize-none leading-6 max-h-40"
            style={{ minHeight: 40 }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="px-6 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 self-end"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
