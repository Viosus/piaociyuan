// lib/auth.ts
// 切回 bcryptjs（pure JS）：@node-rs/bcrypt 是 napi-rs native binding，
// Next.js 16 默认 Turbopack build 对 napi-rs 的 try/catch fallback 加载机制
// 处理不全（即使 serverExternalPackages 配置也没用），运行时报
// "Cannot find module @node-rs/bcrypt-<hash>"。
// bcryptjs 性能差但稳，且 hash 格式与 @node-rs/bcrypt 完全兼容，
// 旧用户密码可以无缝校验。
import { hash as bcryptHash, compare as bcryptVerify } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const SALT_ROUNDS = 12;

export type UserPayload = {
  id: string;
  email?: string;
  phone?: string;
  nickname?: string;
  authProvider: string;
  role: string; // 'user' | 'staff' | 'admin'
};

// 密码加密（@node-rs/bcrypt 是 Rust 实现的 async 原生模块，与 bcryptjs 生成的 $2a$/$2b$ hash 完全兼容）
export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, SALT_ROUNDS);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptVerify(password, hash);
}

// 生成 Access Token（短期，1天 - 方便测试，记住我时为7天）
export function generateAccessToken(user: UserPayload, rememberMe: boolean = false): string {
  const defaultExpires = rememberMe ? '7d' : '1d';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || defaultExpires;
  return jwt.sign(user, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

// 生成 Refresh Token（长期，默认7天，记住我时为30天）
export function generateRefreshToken(user: UserPayload, rememberMe: boolean = false): string {
  const defaultExpires = rememberMe ? '30d' : '7d';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || defaultExpires;
  return jwt.sign(
    { id: user.id, type: 'refresh', rememberMe },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

// 生成双 Token（向后兼容的包装函数）
export function generateToken(user: UserPayload): string {
  return generateAccessToken(user);
}

// 生成完整的 Token 对
export function generateTokenPair(user: UserPayload, rememberMe: boolean = false): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user, rememberMe),
    refreshToken: generateRefreshToken(user, rememberMe),
  };
}

// 验证 JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// 通过邮箱查找用户
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

// 通过手机号查找用户
export async function findUserByPhone(phone: string) {
  return await prisma.user.findUnique({
    where: { phone },
  });
}

// 通过 ID 查找用户
export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

// 创建用户
export async function createUser(data: {
  id: string;
  email?: string;
  phone?: string;
  password?: string;
  nickname?: string;
  authProvider?: string;
}) {
  return await prisma.user.create({
    data: {
      id: data.id,
      email: data.email || null,
      phone: data.phone || null,
      password: data.password || null,
      nickname: data.nickname || null,
      authProvider: data.authProvider || 'local',
    },
  });
}

// 校验器已拆到 lib/validators.ts（纯函数，client 和 server 都安全）
// 这里 re-export 保持向后兼容（server-side 文件原本 import from '@/lib/auth'）
export { isValidEmail, isValidPhone, isValidPassword } from './validators';

// 从请求头获取当前用户
export async function getCurrentUser() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    // 从数据库获取完整的用户信息
    const user = await findUserById(payload.id);

    // 检查用户是否被封禁
    if (user && user.isBanned) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// 检查用户是否为管理员
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'UNAUTHORIZED', message: '请先登录', status: 401 };
  }

  if (user.isBanned) {
    return { error: 'FORBIDDEN', message: '账户已被封禁', status: 403 };
  }

  if (user.role !== 'admin') {
    return { error: 'FORBIDDEN', message: '需要管理员权限', status: 403 };
  }

  return { user };
}
