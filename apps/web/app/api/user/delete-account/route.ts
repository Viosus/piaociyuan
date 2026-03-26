import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || '';

    // Soft delete: anonymize user data
    await prisma.$transaction(async (tx) => {
      // Clear personal info
      await tx.user.update({
        where: { id: user.id },
        data: {
          nickname: '[已注销用户]',
          email: null,
          phone: null,
          password: null,
          avatar: null,
          bio: null,
          role: 'user', // ensure no admin access
        },
      });

      // Delete all active sessions
      await tx.userSession.deleteMany({
        where: { userId: user.id },
      });

      // Delete verification codes associated with the user's email/phone
      const deleteCodeConditions = [];
      if (user.email) deleteCodeConditions.push({ email: user.email });
      if (user.phone) deleteCodeConditions.push({ phone: user.phone });
      if (deleteCodeConditions.length > 0) {
        await tx.verificationCode.deleteMany({
          where: { OR: deleteCodeConditions },
        });
      }

      console.log('[ACCOUNT_DELETED]', {
        userId: user.id,
        reason,
        timestamp: new Date().toISOString(),
      });
    });

    return NextResponse.json({
      ok: true,
      message: '账号已注销。您的订单和票务记录将按法律要求保留。',
    });
  } catch (error) {
    console.error('[DELETE_ACCOUNT_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '账号注销失败，请稍后再试' },
      { status: 500 }
    );
  }
}
