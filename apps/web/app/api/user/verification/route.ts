// app/api/user/verification/route.ts
/**
 * 用户 - 身份认证 API
 *
 * GET /api/user/verification - 获取我的认证申请记录
 * POST /api/user/verification - 提交认证申请
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 获取用户的认证申请记录
    const requests = await prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      data: requests,
    });
  } catch (error: unknown) {
    console.error('[USER_VERIFICATION_GET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取认证记录失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { verifiedType, realName, idCard, organization, proofImages, reason } = body;

    // 3️⃣ 验证必填字段
    if (!verifiedType || !realName || !proofImages || !reason) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '请填写所有必填字段',
        },
        { status: 400 }
      );
    }

    if (!['celebrity', 'artist', 'organizer', 'official'].includes(verifiedType)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '无效的认证类型',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 检查用户是否已经认证
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    if (user?.isVerified) {
      return NextResponse.json(
        {
          ok: false,
          code: 'ALREADY_VERIFIED',
          message: '您已经通过认证',
        },
        { status: 400 }
      );
    }

    // 5️⃣ 检查是否有待审核的申请
    const pendingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PENDING_REQUEST',
          message: '您有正在审核中的申请，请等待审核结果',
        },
        { status: 400 }
      );
    }

    // 6️⃣ 创建认证申请
    const request = await prisma.verificationRequest.create({
      data: {
        userId,
        verifiedType,
        realName,
        idCard: idCard || null,
        organization: organization || null,
        proofImages: JSON.stringify(proofImages),
        reason,
        status: 'pending',
      },
    });

    console.log('[USER_VERIFICATION_CREATED]', { userId, requestId: request.id });

    return NextResponse.json({
      ok: true,
      message: '认证申请已提交，请等待审核',
      data: request,
    });
  } catch (error: unknown) {
    console.error('[USER_VERIFICATION_POST_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '提交认证申请失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
