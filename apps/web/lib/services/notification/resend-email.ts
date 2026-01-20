// lib/services/notification/resend-email.ts
import { Resend } from 'resend';
import type { EmailProvider, SendEmailParams, SendEmailResult } from './types';

/**
 * Resend 邮件服务实现
 */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || '票次元 <noreply@piaociyuan.com>';

    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    // 开发环境：仅打印到控制台
    if (process.env.NODE_ENV === 'development' && !this.client) {
      console.log('='.repeat(50));
      console.log('📧 邮件（开发模式 - Resend 未配置）');
      console.log(`收件人: ${params.to}`);
      console.log(`主题: ${params.subject}`);
      console.log('内容:');
      console.log(params.text || params.html);
      console.log('='.repeat(50));
      return { success: true, messageId: 'dev-mock-id' };
    }

    // 生产环境但未配置 API Key
    if (!this.client) {
      console.error('Resend API Key 未配置');
      return { success: false, error: 'Resend API Key 未配置' };
    }

    try {
      const { data, error } = await this.client.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        console.error('Resend 发送失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error('Resend 发送异常:', message);
      return { success: false, error: message };
    }
  }
}

// 单例实例
let emailProvider: ResendEmailProvider | null = null;

/**
 * 获取邮件服务实例
 */
export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = new ResendEmailProvider();
  }
  return emailProvider;
}
