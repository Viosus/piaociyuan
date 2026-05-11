"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidEmail, isValidPhone, isValidPassword } from "@/lib/validators";
import { useToast } from "@/components/Toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const toast = useToast();
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    verificationCode: "",
    accountType: "email", // email 或 phone
  });
  const [error, setError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateAccount = (value: string, type: string = formData.accountType) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setAccountError("");
      return;
    }
    if (type === "email") {
      setAccountError(isValidEmail(trimmed) ? "" : "邮箱格式不正确");
    } else {
      setAccountError(isValidPhone(trimmed) ? "" : "手机号格式不正确（中国大陆 11 位）");
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("");
      return;
    }
    setPasswordError(isValidPassword(value) ? "" : "密码至少 8 位，需同时包含字母和数字");
  };

  const validateConfirmPassword = (value: string, passwordValue: string = formData.password) => {
    if (!value) {
      setConfirmPasswordError("");
      return;
    }
    setConfirmPasswordError(value === passwordValue ? "" : "两次输入的密码不一致");
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.account) {
      setError(formData.accountType === "email" ? "请先输入邮箱" : "请先输入手机号");
      return;
    }

    setSendingCode(true);
    setError("");

    try {
      const body: Record<string, string> = { type: "register" };
      if (formData.accountType === "email") {
        body.email = formData.account;
      } else {
        body.phone = formData.account;
      }

      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

      toast.success(formData.accountType === "email" ? "验证码已发送，请查收邮件" : "验证码已发送，请查收短信");
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("请先阅读并同意隐私政策和服务条款");
      return;
    }

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
          欢迎注册
        </h1>
        <p className="text-center text-foreground mb-8">
          创建你的票次元账号
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 账号类型选择 */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, accountType: "email", account: "" });
                setAccountError("");
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                formData.accountType === "email"
                  ? "bg-[#46467A] text-white"
                  : "bg-gray-100 text-foreground"
              }`}
            >
              邮箱注册
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, accountType: "phone", account: "" });
                setAccountError("");
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                formData.accountType === "phone"
                  ? "bg-[#46467A] text-white"
                  : "bg-gray-100 text-foreground"
              }`}
            >
              手机注册
            </button>
          </div>

          {/* 账号输入 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {formData.accountType === "email" ? "邮箱" : "手机号"}
            </label>
            <input
              type={formData.accountType === "email" ? "email" : "tel"}
              value={formData.account}
              onChange={(e) => {
                setFormData({ ...formData, account: e.target.value });
                if (accountError) setAccountError("");
              }}
              onBlur={(e) => validateAccount(e.target.value)}
              placeholder={formData.accountType === "email" ? "your@email.com" : "13800138000"}
              required
              aria-invalid={!!accountError}
              aria-describedby={accountError ? "register-account-error" : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent ${
                accountError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {accountError && (
              <p id="register-account-error" className="text-xs text-red-500 mt-1">
                {accountError}
              </p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {formData.accountType === "email" ? "邮箱验证码" : "短信验证码"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.verificationCode}
                onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                placeholder="输入6位验证码"
                maxLength={6}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !formData.account}
                className="px-4 py-3 bg-[#46467A] text-white rounded-lg hover:bg-[#5A5A8E] disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
              >
                {sendingCode
                  ? "发送中..."
                  : countdown > 0
                  ? `${countdown}s`
                  : "发送验证码"}
              </button>
            </div>
          </div>

          {/* 昵称（可选） */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              昵称（可选）
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="给自己起个昵称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              密码
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                const next = e.target.value;
                setFormData({ ...formData, password: next });
                if (passwordError) setPasswordError("");
                if (formData.confirmPassword) {
                  validateConfirmPassword(formData.confirmPassword, next);
                }
              }}
              onBlur={(e) => validatePassword(e.target.value)}
              placeholder="至少8位，包含字母和数字"
              required
              minLength={8}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "register-password-error" : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent ${
                passwordError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {/* 密码强度指示器（W-F5）*/}
            {formData.password && (
              <PasswordStrengthBar password={formData.password} />
            )}
            {passwordError && (
              <p id="register-password-error" className="text-xs text-red-500 mt-1">
                {passwordError}
              </p>
            )}
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              确认密码
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              onBlur={(e) => validateConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              aria-invalid={!!confirmPasswordError}
              aria-describedby={confirmPasswordError ? "register-confirm-error" : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#46467A] focus:border-transparent ${
                confirmPasswordError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {confirmPasswordError && (
              <p id="register-confirm-error" className="text-xs text-red-500 mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* 隐私政策同意 */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#46467A] border-gray-300 rounded focus:ring-[#46467A] cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="ml-2 text-sm text-foreground cursor-pointer select-none">
              我已阅读并同意
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#46467A] underline mx-0.5 hover:text-[#3a3a6a]">隐私政策</a>
              和
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#46467A] underline mx-0.5 hover:text-[#3a3a6a]">服务条款</a>
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
            {loading ? "注册中..." : "注册"}
          </button>

          {/* 第三方登录预留 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-foreground">或使用第三方登录</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-foreground bg-gray-50 cursor-not-allowed"
              >
                微信登录（待接入）
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-foreground bg-gray-50 cursor-not-allowed"
              >
                QQ登录（待接入）
              </button>
            </div>
          </div>

          {/* 登录链接 */}
          <p className="text-center text-sm text-foreground">
            已有账号？
            <Link
              href={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login"}
              className="text-[#46467A] hover:underline ml-1"
            >
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

// W-F5 密码强度指示器：基于长度 + 字符种类打分，显示弱/中/强
function getPasswordStrength(pwd: string): { score: number; label: string; color: string; bg: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: '弱', color: 'text-red-500', bg: 'bg-red-500' };
  if (score <= 3) return { score, label: '中', color: 'text-yellow-600', bg: 'bg-yellow-500' };
  return { score, label: '强', color: 'text-green-600', bg: 'bg-green-500' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { label, color, bg } = getPasswordStrength(password);
  // 显示成 3 段进度条：弱填 1 段、中填 2 段、强填 3 段
  const filledSegments = label === '弱' ? 1 : label === '中' ? 2 : 3;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filledSegments ? bg : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${color}`} aria-live="polite">
        强度：{label}
      </span>
    </div>
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
