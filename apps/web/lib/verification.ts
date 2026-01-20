// lib/verification.ts
// 向后兼容层 - 重新导出新的验证码服务
// 推荐直接使用 @/lib/services/verification

import prisma from './prisma';
import {
  generateCode as _generateCode,
  saveVerificationCode as _saveVerificationCode,
  verifyCode as _verifyCode,
  checkSendFrequency as _checkSendFrequency,
  sendVerificationEmail as _sendVerificationEmail,
} from './services/verification';
import type { VerificationType } from './services/notification/types';

// 重新导出生成验证码函数
export const generateCode = _generateCode;

// 向后兼容：保存验证码（仅支持邮箱）
export async function saveVerificationCode(
  email: string,
  code: string,
  type: string = 'register'
): Promise<{ id: string; expiresAt: Date }> {
  return _saveVerificationCode({
    email,
    code,
    type: type as VerificationType,
  });
}

// 向后兼容：验证验证码（仅支持邮箱）
export async function verifyCode(
  email: string,
  code: string,
  type: string = 'register'
): Promise<boolean> {
  return _verifyCode({
    email,
    code,
    type: type as VerificationType,
  });
}

// 向后兼容：检查发送频率（仅支持邮箱）
export async function checkSendFrequency(
  email: string,
  type: string = 'register'
): Promise<boolean> {
  return _checkSendFrequency({
    email,
    type: type as VerificationType,
  });
}

// 向后兼容：发送验证码邮件
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: string = 'register'
): Promise<boolean> {
  const result = await _sendVerificationEmail(email, code, type as VerificationType);
  return result.success;
}
