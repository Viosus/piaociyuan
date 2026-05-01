"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidEmail, isValidPhone } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [formData, setFormData] = useState({
    account: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateAccount = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setAccountError("");
      return;
    }
    if (isValidEmail(trimmed) || isValidPhone(trimmed)) {
      setAccountError("");
    } else {
      setAccountError("邮箱或手机号格式不正确");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      // 保存 token 和 refreshToken
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);

      // 跳转到指定页面或默认页面（刷新确保 Navbar 重新加载用户信息）
      window.location.href = returnUrl || "/events";
    } catch (error: unknown) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-[#46467A] mb-2">
          欢迎回来
        </h1>
        <p className="text-center text-[#1a1a1f] mb-8">
          登录你的票次元账号
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 账号输入 */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1f] mb-2">
              邮箱 / 手机号
            </label>
            <input
              type="text"
              value={formData.account}
              onChange={(e) => {
                setFormData({ ...formData, account: e.target.value });
                if (accountError) setAccountError("");
              }}
              onBlur={(e) => validateAccount(e.target.value)}
              placeholder="输入邮箱或手机号"
              required
              aria-invalid={!!accountError}
              aria-describedby={accountError ? "login-account-error" : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent ${
                accountError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {accountError && (
              <p id="login-account-error" className="text-xs text-red-500 mt-1">
                {accountError}
              </p>
            )}
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1f] mb-2">
              密码
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="输入密码"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent"
            />
          </div>

          {/* 记住我选项 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-[#46467A] border-gray-300 rounded focus:ring-[#46467A] cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-[#1a1a1f] cursor-pointer select-none">
              30天内免登录
            </label>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#46467A] text-white py-3 rounded-lg font-medium hover:bg-[#5A5A8E] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          {/* 第三方登录预留 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#1a1a1f]">或使用第三方登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-[#1a1a1f] bg-gray-50 cursor-not-allowed"
              >
                微信登录（待接入）
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-[#1a1a1f] bg-gray-50 cursor-not-allowed"
              >
                QQ登录（待接入）
              </button>
            </div>
          </div>

          {/* 注册链接 */}
          <p className="text-center text-sm text-[#1a1a1f]">
            还没有账号？
            <Link
              href={returnUrl ? `/auth/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/register"}
              className="text-[#46467A] hover:underline ml-1"
            >
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">加载中...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
