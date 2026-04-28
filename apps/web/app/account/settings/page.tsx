"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";

function isValidPassword(pwd: string): boolean {
  if (pwd.length < 8) return false;
  return /[a-zA-Z]/.test(pwd) && /\d/.test(pwd);
}

export default function SettingsPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("请完整填写表单");
      return;
    }

    if (currentPassword === newPassword) {
      setError("新密码不能与当前密码相同");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("新密码至少 8 位，需同时包含字母和数字");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost("/api/user/change-password", {
        currentPassword,
        newPassword,
      });

      if (!data.ok) {
        setError(data.message || data.error || "修改失败");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        router.push("/auth/login");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0DFFD] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#46467A] via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent mb-2">
            ⚙️ 偏好设置
          </h1>
          <p className="text-white/60 mb-8">账户安全与个性化设置</p>

          <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">🔐 修改密码</h2>
            <p className="text-sm text-white/50 mb-6">
              为了账户安全，请定期更换密码。修改后将自动登出，请用新密码重新登录。
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-white/70 mb-2">当前密码</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#46467A] focus:bg-white/10 transition"
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 8 位，需含字母和数字"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#46467A] focus:bg-white/10 transition"
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#46467A] focus:bg-white/10 transition"
                  disabled={loading || success}
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
                  ✅ 密码修改成功，即将跳转登录页…
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="flex-1 py-3 text-center bg-gradient-to-r from-[#46467A] to-[#7E7EC8] text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "提交中…" : "确认修改"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="px-6 py-3 border border-white/10 text-white/80 rounded-lg font-medium hover:bg-white/5 transition disabled:opacity-50"
                >
                  返回
                </button>
              </div>
            </form>

            <ul className="mt-6 text-xs text-white/40 space-y-1">
              <li>• 不要使用过于简单的密码</li>
              <li>• 不要使用与其他网站相同的密码</li>
              <li>• 建议定期更换密码并妥善保管</li>
            </ul>
          </section>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🚧</div>
            <p className="text-white/60 mb-4">更多个性化设置功能开发中</p>
            <Link
              href="/account"
              className="inline-block py-2 px-6 bg-white/5 border border-white/10 text-white/80 rounded-lg text-sm hover:bg-white/10 transition"
            >
              👤 返回个人中心
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
