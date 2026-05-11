'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface FollowButtonProps {
  eventId: number;
  eventName: string;
}

export default function FollowButton({ eventId, eventName }: FollowButtonProps) {
  const toast = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 检查是否已登录
  const isLoggedIn = () => {
    return typeof window !== 'undefined' && !!localStorage.getItem('token');
  };

  // 检查是否已关注
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const result = await apiGet(`/api/events/${eventId}/follow`);
        if (result.ok) {
          setIsFollowing(result.data.isFollowing);
        }
      } catch {
        // 静默处理检查关注状态失败
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [eventId]);

  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    if (!isLoggedIn()) {
      // 未登录，跳转到登录页
      window.location.href = '/auth/login';
      return;
    }

    setActionLoading(true);

    try {
      const result = isFollowing
        ? await apiDelete(`/api/events/${eventId}/follow`)
        : await apiPost(`/api/events/${eventId}/follow`, {});

      if (result.ok) {
        setIsFollowing(!isFollowing);

        if (!isFollowing) {
          toast.success(result.message || '已关注活动');
        } else {
          toast.success(result.message || '已取消关注');
        }
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  // 如果未登录，显示登录按钮
  if (!isLoggedIn()) {
    return (
      <button
        onClick={() => (window.location.href = '/auth/login')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#46467A] text-foreground rounded-full hover:bg-[#5A5A8E] transition"
      >
        <span>⭐</span>
        <span>登录后关注</span>
      </button>
    );
  }

  // 加载中
  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-foreground rounded-full cursor-not-allowed"
      >
        <span>⏳</span>
        <span>加载中...</span>
      </button>
    );
  }

  // 已登录，显示关注/取消关注按钮
  return (
    <button
      onClick={handleFollowToggle}
      disabled={actionLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition ${
        isFollowing
          ? 'bg-[#FFF5FB] text-[#46467A] border border-[#46467A] hover:bg-[#FFFAFD]'
          : 'bg-[#46467A] text-white hover:bg-[#5A5A8E]'
      } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span>{isFollowing ? '⭐' : '☆'}</span>
      <span>{actionLoading ? '处理中...' : isFollowing ? '已关注' : '关注活动'}</span>
    </button>
  );
}
