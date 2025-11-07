"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    verificationCode: "",
    accountType: "email", // email 或 phone
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.account) {
      setError("请先输入邮箱");
      return;
    }

    setSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.account,
          type: "register",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      alert("验证码已发送，请查收邮件");
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证密码匹配
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        password: formData.password,
        nickname: formData.nickname || undefined,
      };

      if (formData.accountType === "email") {
        body.email = formData.account;
        body.verificationCode = formData.verificationCode;
      } else {
        body.phone = formData.account;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      // 保存 token
      localStorage.setItem("token", data.data.token);

      // 跳转到指定页面或默认页面（刷新确保 Navbar 重新加载用户信息）
      window.location.href = returnUrl || "/events";
    } catch (err: unknown) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-[#EAF353] mb-2">
          欢迎注册
        </h1>
        <p className="text-center text-[#282828] mb-8">
          创建你的票次元账号
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 账号类型选择 */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: "email", account: "" })}
              className={`flex-1 py-2 rounded-lg transition ${
                formData.accountType === "email"
                  ? "bg-[#EAF353] text-white"
                  : "bg-gray-100 text-[#282828]"
              }`}
            >
              邮箱注册
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: "phone", account: "" })}
              className={`flex-1 py-2 rounded-lg transition ${
                formData.accountType === "phone"
                  ? "bg-[#EAF353] text-white"
                  : "bg-gray-100 text-[#282828]"
              }`}
            >
              手机注册
            </button>
          </div>

          {/* 账号输入 */}
          <div>
            <label className="block text-sm font-medium text-[#282828] mb-2">
              {formData.accountType === "email" ? "邮箱" : "手机号"}
            </label>
            <input
              type={formData.accountType === "email" ? "email" : "tel"}
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              placeholder={formData.accountType === "email" ? "your@email.com" : "13800138000"}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAF353] focus:border-transparent"
            />
          </div>

          {/* 验证码（仅邮箱注册） */}
          {formData.accountType === "email" && (
            <div>
              <label className="block text-sm font-medium text-[#282828] mb-2">
                邮箱验证码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                  placeholder="输入6位验证码"
                  maxLength={6}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAF353] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0 || !formData.account}
                  className="px-4 py-3 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                >
                  {sendingCode
                    ? "发送中..."
                    : countdown > 0
                    ? `${countdown}s`
                    : "发送验证码"}
                </button>
              </div>
            </div>
          )}

          {/* 昵称（可选） */}
          <div>
            <label className="block text-sm font-medium text-[#282828] mb-2">
              昵称（可选）
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="给自己起个昵称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAF353] focus:border-transparent"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-[#282828] mb-2">
              密码
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="至少6位密码"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAF353] focus:border-transparent"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-sm font-medium text-[#282828] mb-2">
              确认密码
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="再次输入密码"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EAF353] focus:border-transparent"
            />
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
            className="w-full bg-[#EAF353] text-white py-3 rounded-lg font-medium hover:bg-[#FFC9E0] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "注册中..." : "注册"}
          </button>

          {/* 第三方登录预留 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#282828]">或使用第三方登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-[#282828] bg-gray-50 cursor-not-allowed"
              >
                微信登录（待接入）
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-[#282828] bg-gray-50 cursor-not-allowed"
              >
                QQ登录（待接入）
              </button>
            </div>
          </div>

          {/* 登录链接 */}
          <p className="text-center text-sm text-[#282828]">
            已有账号？
            <Link
              href={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login"}
              className="text-[#EAF353] hover:underline ml-1"
            >
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">加载中...</div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
