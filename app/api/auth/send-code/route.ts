// app/api/auth/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/auth';
import {
  generateCode,
  saveVerificationCode,
  sendVerificationEmail,
  checkSendFrequency,
} from '@/lib/verification';

export async function POST(req: NextRequest) {
  try {
    const { email, type = 'register' } = await req.json();

    // 验证邮箱格式
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查发送频率
    const canSend = await checkSendFrequency(email, type);
    if (!canSend) {
      return NextResponse.json(
        { ok: false, error: '发送过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateCode();

    // 保存到数据库
    const { expiresAt } = await saveVerificationCode(email, code, type);

    // 发送邮件
    const sent = await sendVerificationEmail(email, code);

    if (!sent) {
      return NextResponse.json(
        { ok: false, error: '验证码发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: '验证码已发送，请查收邮件',
      data: {
        expiresAt,
        expiresIn: 300, // 5分钟
      },
    });
  } catch (error: unknown) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { ok: false, error: '发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
