// lib/verification.ts
import { randomUUID } from 'crypto';
import { getDB } from './database';
import nodemailer from 'nodemailer';

// 生成6位数字验证码
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 保存验证码到数据库
export function saveVerificationCode(email: string, code: string, type: string = 'register') {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5分钟后过期

  db.prepare(`
    INSERT INTO verification_codes (id, email, code, type, expiresAt, createdAt, used)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, email, code, type, expiresAt, now);

  return { id, expiresAt };
}

// 验证验证码
export function verifyCode(email: string, code: string, type: string = 'register'): boolean {
  const db = getDB();
  const now = Date.now();

  // 查找未使用且未过期的验证码
  const record = db.prepare(`
    SELECT * FROM verification_codes
    WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expiresAt > ?
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(email, code, type, now) as any;

  if (!record) {
    return false;
  }

  // 标记为已使用
  db.prepare(`
    UPDATE verification_codes
    SET used = 1
    WHERE id = ?
  `).run(record.id);

  return true;
}

// 清理过期验证码
export function cleanExpiredCodes() {
  const db = getDB();
  const now = Date.now();

  const result = db.prepare(`
    DELETE FROM verification_codes
    WHERE expiresAt < ? OR used = 1
  `).run(now);

  return result.changes;
}

// 发送邮件验证码
export async function sendVerificationEmail(email: string, code: string) {
  // 如果没有配置邮件服务，则输出到控制台（开发模式）
  if (!process.env.SMTP_HOST) {
    console.log('📧 [开发模式] 验证码邮件：');
    console.log(`   收件人: ${email}`);
    console.log(`   验证码: ${code}`);
    console.log('   提示: 生产环境请配置 SMTP 邮件服务');
    return true;
  }

  // 生产环境：使用真实邮件服务
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"票次元" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '票次元 - 注册验证码',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #6366f1; text-align: center;">票次元</h1>
            <h2 style="color: #333; margin-top: 30px;">您的验证码</h2>
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #666; margin-top: 20px;">验证码有效期为 <strong>5分钟</strong>，请尽快完成注册。</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">如果这不是您的操作，请忽略此邮件。</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

// 检查发送频率（防止频繁发送）
export function canSendCode(email: string): { ok: boolean; message?: string; waitTime?: number } {
  const db = getDB();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // 查询1分钟内的发送记录
  const recentCode = db.prepare(`
    SELECT createdAt FROM verification_codes
    WHERE email = ? AND createdAt > ?
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(email, oneMinuteAgo) as any;

  if (recentCode) {
    const waitTime = Math.ceil((60000 - (now - recentCode.createdAt)) / 1000);
    return {
      ok: false,
      message: `请等待 ${waitTime} 秒后再试`,
      waitTime,
    };
  }

  return { ok: true };
}
