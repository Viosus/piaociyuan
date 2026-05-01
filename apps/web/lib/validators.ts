// lib/validators.ts
//
// 纯函数校验器 — 不依赖 next/headers / prisma / 任何运行时上下文，
// 因此 client component 和 server component 都能安全 import。
//
// 之前这 3 个函数住在 lib/auth.ts，但 lib/auth.ts 顶部 import 了 next/headers
// （for getCurrentUser），导致 client component import 整个文件时 Turbopack 报错：
//   "next/headers only works in a Server Component, not pages/ directory"
// 拆到这里后 client (e.g. /auth/login/page.tsx) 可以放心引用。

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证手机号格式（中国大陆）
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 验证密码强度（至少 8 位，包含字母和数字）
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}
