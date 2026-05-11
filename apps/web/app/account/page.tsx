"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from '@/lib/api';

type User = {
  id: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  // 预设头像（使用免费的头像服务）
  const presetAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Precious",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dusty",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Missy",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Felix",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Aneka",
  ];

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    apiGet("/api/auth/me")
      .then((data) => {
        if (data.ok) {
          setUser(data.data);
          setNickname(data.data.nickname || "");
          setAvatarUrl(data.data.avatar || "");
          if (presetAvatars.includes(data.data.avatar)) {
            setSelectedPreset(data.data.avatar);
          }
        }
      })
      .catch(() => {
        // API helper already handles 401 redirects
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 选择预设头像
  const handleSelectPreset = (url: string) => {
    setSelectedPreset(url);
    setAvatarUrl(url);
  };

  // 保存设置
  const handleSave = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const data = await apiPost("/api/user/update", {
        nickname,
        avatar: avatarUrl,
      });

      if (!data.ok) {
        setError(data.error || "保存失败");
        return;
      }

      setSuccess(true);
      setUser(data.data);

      // 2秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-[#FFEBF5] rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#46467A] via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent mb-2">
            👤 个人中心
          </h1>
          <p className="text-white/60 mb-8">管理你的个人信息和偏好设置</p>

          {/* 用户信息展示 */}
          <div className="mb-8 p-4 bg-[#FFF9FC] rounded-xl border border-[#FFEBF5]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-foreground-soft">账号ID：</span>
                <span className="text-foreground font-mono">{user?.id}</span>
              </div>
              {user?.phone && (
                <div>
                  <span className="text-foreground-soft">手机号：</span>
                  <span className="text-foreground">{user.phone}</span>
                </div>
              )}
              {user?.email && (
                <div>
                  <span className="text-foreground-soft">邮箱：</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* 当前头像预览 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">
              当前头像
            </label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="当前头像"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#FFE3F0]"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#46467A] to-[#E0DFFD] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {user?.nickname?.[0] || user?.email?.[0] || "U"}
                </div>
              )}
              <div className="text-sm text-foreground-soft">
                {avatarUrl ? "已设置头像" : "未设置头像"}
              </div>
            </div>
          </div>

          {/* 昵称 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-2">
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent text-foreground"
            />
          </div>

          {/* 预设头像选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">
              选择预设头像
            </label>
            <div className="grid grid-cols-6 gap-4">
              {presetAvatars.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPreset(url)}
                  className={`w-full aspect-square rounded-full overflow-hidden border-2 transition ${
                    selectedPreset === url
                      ? "border-[#46467A] ring-2 ring-[#46467A]/30"
                      : "border-[#FFEBF5] hover:border-[#FFE3F0]"
                  }`}
                >
                  <img
                    src={url}
                    alt={`预设头像 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 自定义头像 URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-2">
              或输入头像 URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setSelectedPreset("");
              }}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent text-foreground"
            />
            <p className="mt-2 text-xs text-foreground-soft">
              提示：可以使用任何公开的图片链接作为头像
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              保存成功！即将刷新页面...
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#46467A] text-white py-3 rounded-lg font-medium hover:bg-[#5A5A8E] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-8 py-3 border border-gray-300 text-foreground rounded-lg font-medium hover:bg-gray-50 transition"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
