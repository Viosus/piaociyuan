// lib/services/notification/types.ts

/**
 * 验证码类型
 */
export type VerificationType = 'register' | 'login' | 'reset_password';

/**
 * 通知渠道
 */
export type NotificationChannel = 'email' | 'sms';

/**
 * 邮件发送参数
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * 邮件发送结果
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 邮件服务提供商接口
 */
export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}

/**
 * 短信发送参数
 */
export interface SendSmsParams {
  phone: string;
  content: string;
  templateId?: string;
  templateParams?: Record<string, string>;
}

/**
 * 短信发送结果
 */
export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 短信服务提供商接口
 */
export interface SmsProvider {
  send(params: SendSmsParams): Promise<SendSmsResult>;
}

/**
 * 短信服务提供商类型
 */
export type SmsProviderType = 'mock' | 'aliyun' | 'tencent';

/**
 * 验证码发送参数
 */
export interface SendVerificationCodeParams {
  email?: string;
  phone?: string;
  code: string;
  type: VerificationType;
}

/**
 * 验证码发送结果
 */
export interface SendVerificationCodeResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
}
