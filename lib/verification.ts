// lib/verification.ts
import prisma from './prisma';
import nodemailer from 'nodemailer';

// 生成6位数字验证码
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 保存验证码到数据库
export async function saveVerificationCode(
  email: string,
  code: string,
  type: string = 'register'
) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

  const record = await prisma.verificationCode.create({
    data: {
      email,
      code,
      type,
      expiresAt,
      used: false,
    },
  });

  return { id: record.id, expiresAt };
}

// 验证验证码
export async function verifyCode(
  email: string,
  code: string,
  type: string = 'register'
): Promise<boolean> {
  const now = new Date();

  // 查找未使用且未过期的验证码
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
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

// 检查验证码发送频率（防止频繁发送）
export async function checkSendFrequency(
  email: string,
  type: string = 'register'
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const recentCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      type,
      createdAt: {
        gte: oneMinuteAgo,
      },
    },
  });

  return !recentCode; // 返回 true 表示可以发送，false 表示需要等待
}

// 发送验证码邮件
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: string = 'register'
) {
  // 开发环境：仅打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log('='.repeat(50));
    console.log('📧 验证码邮件（开发模式）');
    console.log(`收件人: ${email}`);
    console.log(`类型: ${type}`);
    console.log(`验证码: ${code}`);
    console.log(`有效期: 5分钟`);
    console.log('='.repeat(50));
    return true;
  }

  // 生产环境：发送真实邮件
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const typeMap: Record<string, string> = {
    register: '注册',
    login: '登录',
    reset_password: '重置密码',
  };

  const subject = `票次元 - ${typeMap[type] || '验证'}验证码`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>您的验证码</h2>
      <p>您正在进行${typeMap[type] || '验证'}操作，验证码为：</p>
      <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">该验证码5分钟内有效，请勿泄露给他人。</p>
      <p style="color: #999; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"票次元" <noreply@piaociyuan.com>',
      to: email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    return false;
  }
}
