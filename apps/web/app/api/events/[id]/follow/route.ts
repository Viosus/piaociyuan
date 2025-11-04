// app/api/events/[id]/follow/route.ts
/**
 * 活动关注/取消关注 API
 *
 * 功能：
 * - POST: 关注活动
 * - DELETE: 取消关注活动
 * - GET: 检查是否已关注活动
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - 检查是否已关注活动
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0️⃣ 获取参数
    const { id } = await params;

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
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '活动 ID 无效',
        },
        { status: 400 }
      );
    }

    // 2️⃣ 检查是否已关注
    const follow = await prisma.eventFollow.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        isFollowing: !!follow,
        followedAt: follow?.createdAt.toISOString() || null,
      },
    });
  } catch (error: unknown) {
    console.error('[CHECK_FOLLOW_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '检查关注状态失败',
      },
      { status: 500 }
    );
  }
}

// POST - 关注活动
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0️⃣ 获取参数
    const { id } = await params;

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
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '活动 ID 无效',
        },
        { status: 400 }
      );
    }

    // 2️⃣ 检查活动是否存在
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true },
    });

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          code: 'EVENT_NOT_FOUND',
          message: '活动不存在',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 创建关注记录（使用 upsert 避免重复关注报错）
    const follow = await prisma.eventFollow.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {},
      create: {
        userId,
        eventId,
      },
    });

    console.log(`[FOLLOW_EVENT_SUCCESS] userId=${userId}, eventId=${eventId}, eventName=${event.name}`);

    return NextResponse.json({
      ok: true,
      message: `已关注活动：${event.name}`,
      data: {
        followId: follow.id,
        eventId: event.id,
        eventName: event.name,
        followedAt: follow.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('[FOLLOW_EVENT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '关注活动失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 取消关注活动
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0️⃣ 获取参数
    const { id } = await params;

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
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '活动 ID 无效',
        },
        { status: 400 }
      );
    }

    // 2️⃣ 检查关注记录是否存在
    const follow = await prisma.eventFollow.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        event: {
          select: { name: true },
        },
      },
    });

    if (!follow) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOLLOWING',
          message: '您尚未关注此活动',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 删除关注记录
    await prisma.eventFollow.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    console.log(`[UNFOLLOW_EVENT_SUCCESS] userId=${userId}, eventId=${eventId}, eventName=${follow.event.name}`);

    return NextResponse.json({
      ok: true,
      message: `已取消关注活动：${follow.event.name}`,
      data: {
        eventId,
        eventName: follow.event.name,
      },
    });
  } catch (error: unknown) {
    console.error('[UNFOLLOW_EVENT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '取消关注失败',
      },
      { status: 500 }
    );
  }
}
