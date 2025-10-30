// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 10;

export type UserPayload = {
  id: string;
  email?: string;
  phone?: string;
  nickname?: string;
  authProvider: string;
};

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
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
export function findUserByEmail(email: string) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

// 通过手机号查找用户
export function findUserByPhone(phone: string) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
}

// 通过 ID 查找用户
export function findUserById(id: string) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

// 创建用户
export function createUser(data: {
  id: string;
  email?: string;
  phone?: string;
  password?: string;
  nickname?: string;
  authProvider?: string;
}) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO users (id, email, phone, password, nickname, authProvider, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  return stmt.run(
    data.id,
    data.email || null,
    data.phone || null,
    data.password || null,
    data.nickname || null,
    data.authProvider || 'local'
  );
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
