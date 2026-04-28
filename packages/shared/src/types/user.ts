// User 相关类型
// 对应 Prisma schema 中的 model User（apps/web/prisma/schema.prisma:141）
// 注意：API JSON 序列化后 DateTime 字段都是 ISO 字符串，不是 Date 对象

export type UserRole = 'user' | 'staff' | 'admin';
export type AuthProvider = 'local' | 'wechat' | 'qq';
export type VerifiedType = 'celebrity' | 'artist' | 'organizer' | 'official';

/**
 * 完整用户对象（自己看自己时返回）
 */
export interface User {
  id: string;                  // UUID
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;

  authProvider: string;        // local / wechat / qq
  role: string;                // user / staff / admin

  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;

  bio: string | null;
  coverImage: string | null;
  website: string | null;
  location: string | null;

  isVerified: boolean;
  verifiedType: string | null;
  verifiedAt: string | null;
  verificationBadge: string | null;

  collectibleCount: number;
  followerCount: number;
  followingCount: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * 公开用户对象（看他人主页时返回，不含敏感字段）
 */
export interface UserPublic {
  id: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  coverImage: string | null;
  isVerified: boolean;
  verifiedType: string | null;
  verificationBadge: string | null;
  collectibleCount: number;
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

/**
 * 登录响应里的 user 字段（精简版）
 */
export interface UserAuthSummary {
  id: string;
  phone: string | null;
  email: string | null;
  nickname: string | null;
  role: string;
}
