// app/api/auth/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, isValidPhone } from '@/lib/auth';
import { sendVerificationCodeFull } from '@/lib/services/verification';
import type { VerificationType } from '@/lib/services/notification/types';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, type = 'register' } = await req.json();

    // 验证：必须提供邮箱或手机号其中之一
    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: '请输入有效的手机号' },
        { status: 400 }
      );
    }

    // 验证 type 是否有效
    const validTypes: VerificationType[] = ['register', 'login', 'reset_password'];
    if (!validTypes.includes(type as VerificationType)) {
      return NextResponse.json(
        { ok: false, error: '无效的验证码类型' },
        { status: 400 }
      );
    }

    // 发送验证码
    const result = await sendVerificationCodeFull({
      email: email || undefined,
      phone: phone || undefined,
      type: type as VerificationType,
    });

    if (!result.success) {
      // 频率限制返回 429
      if (result.error === '发送过于频繁，请稍后再试') {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { ok: false, error: result.error || '验证码发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 根据发送渠道返回不同提示
    const channelMessage = result.channel === 'sms'
      ? '验证码已发送至您的手机'
      : '验证码已发送，请查收邮件';

    return NextResponse.json({
      ok: true,
      message: channelMessage,
      data: {
        channel: result.channel,
        expiresAt: result.expiresAt,
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
