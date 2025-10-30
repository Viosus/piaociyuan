// lib/session.ts
import prisma from './prisma';
import { randomUUID } from 'crypto';

/**
 * 创建用户会话（存储 Refresh Token）
 */
export async function createUserSession(data: {
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
}) {
  const session = await prisma.userSession.create({
    data: {
      id: randomUUID(),
      userId: data.userId,
      refreshToken: data.refreshToken,
      deviceInfo: data.deviceInfo || null,
      ipAddress: data.ipAddress || null,
      expiresAt: data.expiresAt,
      revoked: false,
    },
  });

  return session.id;
}

/**
 * 查找有效的会话（通过 Refresh Token）
 */
export async function findSessionByRefreshToken(refreshToken: string) {
  return await prisma.userSession.findFirst({
    where: {
      refreshToken,
      revoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

/**
 * 撤销会话（登出）
 */
export async function revokeSession(refreshToken: string) {
  await prisma.userSession.updateMany({
    where: { refreshToken },
    data: {
      revoked: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * 撤销用户的所有会话（全部登出）
 */
export async function revokeAllUserSessions(userId: string) {
  await prisma.userSession.updateMany({
    where: { userId },
    data: {
      revoked: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * 清理过期的会话
 */
export async function cleanupExpiredSessions() {
  return await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}

/**
 * 记录登录日志
 */
export async function createLoginLog(data: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  failReason?: string;
}) {
  const log = await prisma.loginLog.create({
    data: {
      id: randomUUID(),
      userId: data.userId,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      location: data.location || null,
      success: data.success,
      failReason: data.failReason || null,
    },
  });

  return log.id;
}

/**
 * 获取用户的登录历史
 */
export async function getUserLoginHistory(userId: string, limit = 10) {
  return await prisma.loginLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * 从请求中提取设备信息
 */
export function extractDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'Unknown';

  // 简单的设备识别
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    return 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}

/**
 * 获取客户端 IP 地址（从 NextRequest）
 */
export function getClientIP(headers: Headers): string | undefined {
  // 尝试从不同的 header 获取真实 IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}
