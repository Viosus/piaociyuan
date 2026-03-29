'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { formatMessageTime, shouldShowTimeDivider } from '@/lib/time';

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
  conversationId?: string; // 用于 WebSocket 推送的消息
}

interface ConversationData {
  id: string;
  otherUser: User;
  messages: Message[];
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 使用 WebSocket 实时通信
  const { isConnected, getSocket } = useSocket({
    autoConnect: true,
  });

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?returnUrl=' + encodeURIComponent(`/messages/${conversationId}`));
      return;
    }

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // 🔥 监听实时消息
  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const handleNewMessage = (newMessage: Message) => {

      // 只处理当前对话的消息
      if (newMessage.conversationId !== conversationId) return;

      setConversation((prev) => {
        if (!prev) return prev;

        // 避免重复添加消息
        const messageExists = prev.messages.some(m => m.id === newMessage.id);
        if (messageExists) return prev;

        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [isConnected, conversationId, getSocket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const data = await apiGet(`/api/messages/conversations/${conversationId}`);
      setConversation(data);
    } catch {
      // 静默处理加载对话失败
      router.push('/messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const newMessage = await apiPost('/api/messages', {
        conversationId,
        content: message.trim(),
        receiverId: conversation.otherUser.id,
      });

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
            }
          : null
      );
      setMessage('');
    } catch {
      // 静默处理发送消息失败
      alert('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const formatTime = formatMessageTime;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0DFFD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#46467A] mx-auto mb-4"></div>
          <p className="text-white/60">加载中...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#E0DFFD] flex flex-col -mt-20">
      {/* Header - 使用 fixed 定位覆盖全局搜索栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#FFEBF5] px-4 py-3 flex items-center gap-3 fixed top-0 left-20 right-[var(--right-sidebar-width,64px)] z-50">
        <button
          onClick={() => router.push('/messages')}
          className="p-2 hover:bg-white/90 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-[#1a1a1f]" />
        </button>

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
      </div>

      {/* Messages - 添加顶部内边距避免被 header 覆盖 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 mt-16">
        <div className="max-w-4xl mx-auto space-y-4">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-[#FFEBF5] p-8">
              <p className="text-[#1a1a1f]/60">
                还没有消息，发送第一条消息开始对话吧
              </p>
            </div>
          ) : (
            conversation.messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === conversation.otherUser.id ? false : true;
              const showAvatar =
                index === 0 || conversation.messages[index - 1]?.senderId !== msg.senderId;
              const showTimeDivider =
                index === 0 ||
                shouldShowTimeDivider(
                  conversation.messages[index - 1].createdAt,
                  msg.createdAt
                );

              return (
                <div key={msg.id}>
                  {/* 时间分隔线 */}
                  {showTimeDivider && (
                    <div className="text-center my-3">
                      <span className="text-xs text-white/40 bg-white/10 px-3 py-1 rounded-full">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
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

                    {/* Message bubble */}
                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                      {showAvatar && (
                        <div
                          className={`text-xs text-white/60 mb-1 ${
                            isCurrentUser ? 'text-right' : ''
                          }`}
                        >
                          {isCurrentUser ? '我' : msg.sender.nickname}
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 break-words ${
                          isCurrentUser
                            ? 'bg-[#46467A] text-white ml-auto'
                            : 'bg-white/80 backdrop-blur-sm text-[#1a1a1f] border border-[#FFEBF5]'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {/* Spacer for current user */}
                    {isCurrentUser && <div className="flex-shrink-0 w-10" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-[#FFEBF5] px-4 py-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入消息..."
            disabled={sending}
            className="flex-1 px-4 py-2 bg-white border border-[#FFEBF5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] disabled:bg-gray-100 text-[#1a1a1f]"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
