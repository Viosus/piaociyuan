// app/api/user/collection/[id]/route.ts
/**
 * 单个收藏品详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
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
    const { id } = await params;

    console.log('[BADGE_DETAIL] 查询:', { userId, badgeId: id });

    // 2️⃣ 查询收藏品详情
    const userBadge = await prisma.userBadge.findFirst({
      where: {
        id,
        userId, // 确保是用户自己的收藏品
      },
      include: {
        badge: {
          include: {
            event: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            status: true,
            price: true,
            purchasedAt: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });

    if (!userBadge) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '收藏品不存在',
        },
        { status: 404 }
      );
    }

    // 3️⃣ 格式化数据
    const data = {
      id: userBadge.id,
      badge: {
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        imageUrl: userBadge.badge.imageUrl,
        rarity: userBadge.badge.rarity,
        type: userBadge.badge.type,
        // 3D/AR
        has3DModel: userBadge.badge.has3DModel,
        model3DUrl: userBadge.badge.model3DUrl || null,
        modelFormat: userBadge.badge.modelFormat || null,
        hasAR: userBadge.badge.hasAR,
        arUrl: userBadge.badge.arUrl || null,
        hasAnimation: userBadge.badge.hasAnimation,
        animationUrl: userBadge.badge.animationUrl || null,
        modelConfig: userBadge.badge.modelConfig
          ? JSON.parse(userBadge.badge.modelConfig)
          : null,
        event: {
          id: userBadge.badge.event.id,
          name: userBadge.badge.event.name,
          city: userBadge.badge.event.city,
          venue: userBadge.badge.event.venue,
          date: userBadge.badge.event.date,
          time: userBadge.badge.event.time,
          cover: userBadge.badge.event.cover,
          artist: userBadge.badge.event.artist,
          desc: userBadge.badge.event.desc,
        },
      },
      ticket: userBadge.ticket
        ? {
            id: userBadge.ticket.id,
            ticketCode: userBadge.ticket.ticketCode,
            status: userBadge.ticket.status,
            price: userBadge.ticket.price,
            purchasedAt: userBadge.ticket.purchasedAt?.toISOString() || null,
          }
        : null,
      order: userBadge.order
        ? {
            id: userBadge.order.id,
            status: userBadge.order.status,
            createdAt: Number(userBadge.order.createdAt),
            paidAt: userBadge.order.paidAt
              ? Number(userBadge.order.paidAt)
              : null,
          }
        : null,
      obtainedAt: userBadge.obtainedAt.toISOString(),
      metadata: userBadge.metadata ? JSON.parse(userBadge.metadata) : null,
    };

    console.log('[BADGE_DETAIL] 查询成功');

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error('[BADGE_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询失败',
      },
      { status: 500 }
    );
  }
}
