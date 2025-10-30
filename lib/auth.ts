// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 12; // 从 10 提升到 12，增强安全性

export type UserPayload = {
  id: string;
  email?: string;
  phone?: string;
  nickname?: string;
  authProvider: string;
  role: string; // 'user' | 'staff' | 'admin'
};

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 Access Token（短期，1天 - 方便测试）
export function generateAccessToken(user: UserPayload): string {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '1d';
  return jwt.sign(user, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

// 生成 Refresh Token（长期，7天）
export function generateRefreshToken(user: UserPayload): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

// 生成双 Token（向后兼容的包装函数）
export function generateToken(user: UserPayload): string {
  return generateAccessToken(user);
}

// 生成完整的 Token 对
export function generateTokenPair(user: UserPayload): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
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

// 验证密码强度（至少6位）
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}
