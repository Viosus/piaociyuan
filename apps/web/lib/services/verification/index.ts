// lib/services/verification/index.ts

import prisma from '@/lib/prisma';
import { getEmailProvider } from '../notification/resend-email';
import { getSmsProvider } from '../notification/sms-provider';
import {
  getEmailSubject,
  getEmailHtml,
  getEmailText,
  getSmsContent,
} from './templates';
import type {
  VerificationType,
  NotificationChannel,
  SendVerificationCodeResult,
} from '../notification/types';

/**
 * 生成 6 位数字验证码
 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 保存验证码到数据库
 */
export async function saveVerificationCode(params: {
  email?: string;
  phone?: string;
  code: string;
  type: VerificationType;
}): Promise<{ id: string; expiresAt: Date }> {
  const { email, phone, code, type } = params;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

  const record = await prisma.verificationCode.create({
    data: {
      email: email || null,
      phone: phone || null,
      code,
      type,
      expiresAt,
      used: false,
    },
  });

  return { id: record.id, expiresAt };
}

/**
 * 验证验证码
 */
export async function verifyCode(params: {
  email?: string;
  phone?: string;
  code: string;
  type: VerificationType;
}): Promise<boolean> {
  const { email, phone, code, type } = params;
  const now = new Date();

  // 构建查询条件
  const whereCondition: {
    code: string;
    type: string;
    used: boolean;
    expiresAt: { gt: Date };
    email?: string;
    phone?: string;
  } = {
    code,
    type,
    used: false,
    expiresAt: { gt: now },
  };

  if (email) {
    whereCondition.email = email;
  } else if (phone) {
    whereCondition.phone = phone;
  } else {
    return false;
  }

  // 查找未使用且未过期的验证码
  const record = await prisma.verificationCode.findFirst({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return false;
  }

  // 标记为已使用
  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}

/**
 * 检查验证码发送频率（防止频繁发送）
 */
export async function checkSendFrequency(params: {
  email?: string;
  phone?: string;
  type: VerificationType;
}): Promise<boolean> {
  const { email, phone, type } = params;
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // 构建查询条件
  const whereCondition: {
    type: string;
    createdAt: { gte: Date };
    email?: string;
    phone?: string;
  } = {
    type,
    createdAt: { gte: oneMinuteAgo },
  };

  if (email) {
    whereCondition.email = email;
  } else if (phone) {
    whereCondition.phone = phone;
  } else {
    return false;
  }

  const recentCode = await prisma.verificationCode.findFirst({
    where: whereCondition,
  });

  return !recentCode; // 返回 true 表示可以发送，false 表示需要等待
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: VerificationType = 'register'
): Promise<SendVerificationCodeResult> {
  const emailProvider = getEmailProvider();

  const result = await emailProvider.send({
    to: email,
    subject: getEmailSubject(type),
    html: getEmailHtml(code, type),
    text: getEmailText(code, type),
  });

  return {
    success: result.success,
    channel: 'email',
    error: result.error,
  };
}

/**
 * 发送验证码短信
 */
export async function sendVerificationSms(
  phone: string,
  code: string,
  type: VerificationType = 'register'
): Promise<SendVerificationCodeResult> {
  const smsProvider = getSmsProvider();

  const result = await smsProvider.send({
    phone,
    content: getSmsContent(code, type),
  });

  return {
    success: result.success,
    channel: 'sms',
    error: result.error,
  };
}

/**
 * 发送验证码（统一入口）
 * 根据传入的 email 或 phone 自动选择发送渠道
 */
export async function sendVerificationCode(params: {
  email?: string;
  phone?: string;
  code: string;
  type: VerificationType;
}): Promise<SendVerificationCodeResult> {
  const { email, phone, code, type } = params;

  if (email) {
    return sendVerificationEmail(email, code, type);
  }

  if (phone) {
    return sendVerificationSms(phone, code, type);
  }

  return {
    success: false,
    channel: 'email',
    error: '请提供邮箱或手机号',
  };
}

/**
 * 完整的发送验证码流程
 * 包含频率检查、保存和发送
 */
export async function sendVerificationCodeFull(params: {
  email?: string;
  phone?: string;
  type: VerificationType;
}): Promise<{
  success: boolean;
  channel?: NotificationChannel;
  expiresAt?: Date;
  error?: string;
}> {
  const { email, phone, type } = params;

  // 1. 检查发送频率
  const canSend = await checkSendFrequency({ email, phone, type });
  if (!canSend) {
    return { success: false, error: '发送过于频繁，请稍后再试' };
  }

  // 2. 生成验证码
  const code = generateCode();

  // 3. 保存到数据库
  const { expiresAt } = await saveVerificationCode({ email, phone, code, type });

  // 4. 发送验证码
  const result = await sendVerificationCode({ email, phone, code, type });

  if (!result.success) {
    return { success: false, error: result.error || '验证码发送失败' };
  }

  return {
    success: true,
    channel: result.channel,
    expiresAt,
  };
}
