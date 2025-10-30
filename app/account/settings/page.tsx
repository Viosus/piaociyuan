"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export default function SettingsPage() {
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

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setUser(data.data);
          setNickname(data.data.nickname || "");
          setAvatarUrl(data.data.avatar || "");
          if (presetAvatars.includes(data.data.avatar)) {
            setSelectedPreset(data.data.avatar);
          }
        } else {
          localStorage.removeItem("token");
          router.push("/auth/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/auth/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

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
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname,
          avatar: avatarUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }

      setSuccess(true);
      setUser(data.data);

      // 2秒后跳转回主页
      setTimeout(() => {
        router.push("/events");
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
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">个人设置</h1>
          <p className="text-gray-500 mb-8">修改你的个人信息和头像</p>

          {/* 当前头像预览 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              当前头像
            </label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="当前头像"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {user?.nickname?.[0] || user?.email?.[0] || "U"}
                </div>
              )}
              <div className="text-sm text-gray-600">
                {avatarUrl ? "已设置头像" : "未设置头像"}
              </div>
            </div>
          </div>

          {/* 昵称 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 预设头像选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择预设头像
            </label>
            <div className="grid grid-cols-6 gap-4">
              {presetAvatars.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPreset(url)}
                  className={`w-full aspect-square rounded-full overflow-hidden border-2 transition ${
                    selectedPreset === url
                      ? "border-indigo-600 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-indigo-400"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-2 text-xs text-gray-500">
              提示：可以使用任何公开的图片链接作为头像
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              保存成功！即将返回主页...
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
