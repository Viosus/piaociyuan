// app/api/user/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 验证 token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: '未登录' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: 'Token 无效' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { avatar, nickname } = body;

    console.log('[USER_UPDATE] 用户更新请求:', { userId: payload.id, avatar, nickname });

    // 构建更新数据
    const updateData: any = {};

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: '没有要更新的内容' },
        { status: 400 }
      );
    }

    // 使用 Prisma 更新用户信息
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: updateData,
    });

    console.log('[USER_UPDATE] 更新成功');

    return NextResponse.json({
      ok: true,
      message: '更新成功',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('用户信息更新失败:', error);
    return NextResponse.json(
      { ok: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}
