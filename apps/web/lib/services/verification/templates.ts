// lib/services/verification/templates.ts

import type { VerificationType } from '../notification/types';

/**
 * 验证类型中文映射
 */
export const verificationTypeLabels: Record<VerificationType, string> = {
  register: '注册',
  login: '登录',
  reset_password: '重置密码',
};

/**
 * 生成邮件主题
 */
export function getEmailSubject(type: VerificationType): string {
  return `票次元 - ${verificationTypeLabels[type] || '验证'}验证码`;
}

/**
 * 生成邮件 HTML 内容
 */
export function getEmailHtml(code: string, type: VerificationType): string {
  const typeLabel = verificationTypeLabels[type] || '验证';

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #46467A 0%, #6B6BA8 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">票次元</h1>
                  <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">您的数字票务平台</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1a1a1f; font-size: 20px; font-weight: 600;">${typeLabel}验证码</h2>
                  <p style="margin: 0 0 24px; color: #666666; font-size: 15px; line-height: 1.6;">
                    您正在进行${typeLabel}操作，请使用以下验证码完成验证：
                  </p>

                  <!-- Code Box -->
                  <div style="background: linear-gradient(135deg, #E0DFFD 0%, #F0F0FF 100%); padding: 24px; text-align: center; border-radius: 8px; margin: 0 0 24px;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #46467A;">${code}</span>
                  </div>

                  <p style="margin: 0 0 8px; color: #999999; font-size: 13px;">
                    ⏰ 该验证码 <strong>5 分钟</strong>内有效
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 13px;">
                    🔒 请勿将验证码泄露给他人
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 24px 40px; border-top: 1px solid #eeeeee;">
                  <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                    如果这不是您的操作，请忽略此邮件。<br>
                    此邮件由系统自动发送，请勿回复。
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * 生成邮件纯文本内容
 */
export function getEmailText(code: string, type: VerificationType): string {
  const typeLabel = verificationTypeLabels[type] || '验证';

  return `
票次元 - ${typeLabel}验证码

您正在进行${typeLabel}操作，验证码为：${code}

该验证码 5 分钟内有效，请勿泄露给他人。

如果这不是您的操作，请忽略此邮件。
  `.trim();
}

/**
 * 生成短信内容
 */
export function getSmsContent(code: string, type: VerificationType): string {
  const typeLabel = verificationTypeLabels[type] || '验证';
  return `【票次元】您的${typeLabel}验证码是：${code}，5分钟内有效。请勿泄露给他人。`;
}

/**
 * 获取短信模板参数（用于云服务商模板短信）
 */
export function getSmsTemplateParams(code: string, type: VerificationType): Record<string, string> {
  return {
    code,
    type: verificationTypeLabels[type] || '验证',
    expireMinutes: '5',
  };
}
