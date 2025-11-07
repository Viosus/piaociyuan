//app/encore/ui/FavoriteButton.tsx
"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

interface FavoriteButtonProps {
  postId: string;
}

export default function FavoriteButton({ postId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 检查收藏状态
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const result = await apiGet(`/api/posts/${postId}/favorite`);
        if (result.ok) {
          setIsFavorited(result.isFavorited);
        }
      } catch (error) {
        console.error("Check favorite error:", error);
      } finally {
        setChecking(false);
      }
    };

    checkFavoriteStatus();
  }, [postId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    console.log('[FavoriteButton] 点击收藏按钮', { postId, isFavorited, loading });

    // 阻止事件冒泡，防止触发父元素的Link跳转
    e.preventDefault();
    e.stopPropagation();

    if (loading) {
      console.log('[FavoriteButton] 正在加载中，忽略点击');
      return;
    }

    setLoading(true);

    try {
      if (isFavorited) {
        // 取消收藏
        console.log('[FavoriteButton] 正在取消收藏...');
        const result = await apiDelete(`/api/posts/${postId}/favorite`);
        console.log('[FavoriteButton] 取消收藏结果:', result);
        if (result.ok) {
          setIsFavorited(false);
        } else {
          alert(`❌ ${result.message || "取消收藏失败"}`);
        }
      } else {
        // 添加收藏
        console.log('[FavoriteButton] 正在添加收藏...');
        const result = await apiPost(`/api/posts/${postId}/favorite`, {});
        console.log('[FavoriteButton] 添加收藏结果:', result);
        if (result.ok) {
          setIsFavorited(true);
        } else {
          if (result.code === "ALREADY_FAVORITED") {
            setIsFavorited(true);
          } else {
            alert(`❌ ${result.message || "收藏失败"}`);
          }
        }
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      alert("❌ 网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        className="p-2 rounded-full hover:bg-gray-100 transition"
        disabled
      >
        <span className="text-lg opacity-30">⭐</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      className={`p-2 rounded-full transition ${
        isFavorited
          ? "text-yellow-500 hover:bg-yellow-50"
          : "text-gray-400 hover:bg-gray-100"
      }`}
      disabled={loading}
      title={isFavorited ? "取消收藏" : "收藏"}
    >
      <span className={`text-lg ${loading ? "opacity-50" : ""}`}>
        {isFavorited ? "⭐" : "☆"}
      </span>
    </button>
  );
}
