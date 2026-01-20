// lib/services/notification/index.ts

// 类型导出
export type {
  VerificationType,
  NotificationChannel,
  SendEmailParams,
  SendEmailResult,
  EmailProvider,
  SendSmsParams,
  SendSmsResult,
  SmsProvider,
  SmsProviderType,
  SendVerificationCodeParams,
  SendVerificationCodeResult,
} from './types';

// 邮件服务
export { ResendEmailProvider, getEmailProvider } from './resend-email';

// 短信服务
export { getSmsProvider, sendSms } from './sms-provider';
