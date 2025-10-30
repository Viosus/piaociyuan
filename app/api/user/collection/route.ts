// app/api/user/collection/route.ts
/**
 * 我的收藏 API
 *
 * 功能：
 * - 获取用户的所有数字纪念品
 * - 支持按稀有度、类型筛选
 * - 支持分页
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

    // 2️⃣ 获取查询参数
    const { searchParams } = new URL(req.url);
    const rarity = searchParams.get('rarity'); // common, rare, epic, legendary
    const type = searchParams.get('type'); // badge, ticket_stub, poster, certificate
    const eventId = searchParams.get('eventId'); // 筛选特定活动
    const orderId = searchParams.get('orderId'); // 筛选特定订单
    const ticketId = searchParams.get('ticketId'); // 筛选特定票

    console.log('[COLLECTION] 查询参数:', { userId, rarity, type, eventId, orderId, ticketId });

    // 3️⃣ 构建查询条件
    const where: any = {
      userId,
    };

    if (orderId) {
      where.orderId = orderId;
    }

    if (ticketId) {
      where.ticketId = ticketId;
    }

    if (rarity || type || eventId) {
      where.badge = {};
      if (rarity) where.badge.rarity = rarity;
      if (type) where.badge.type = type;
      if (eventId) where.badge.eventId = parseInt(eventId);
    }

    // 4️⃣ 查询用户的纪念品
    type UserBadgeWithRelations = Prisma.UserBadgeGetPayload<{
      include: {
        badge: {
          include: {
            event: {
              select: {
                id: true;
                name: true;
                city: true;
                venue: true;
                date: true;
                time: true;
                cover: true;
              };
            };
          };
        };
        ticket: {
          select: {
            id: true;
            ticketCode: true;
            status: true;
          };
        };
        order: {
          select: {
            id: true;
            status: true;
            createdAt: true;
          };
        };
      };
    }>;

    const userBadges: UserBadgeWithRelations[] = await prisma.userBadge.findMany({
      where,
      include: {
        badge: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                city: true,
                venue: true,
                date: true,
                time: true,
                cover: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            status: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { obtainedAt: 'desc' }, // 最新获得的在前
      ],
    });

    // 5️⃣ 格式化数据
    const collection = userBadges.map((ub) => ({
      id: ub.id,
      badge: {
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        imageUrl: ub.badge.imageUrl,
        rarity: ub.badge.rarity,
        type: ub.badge.type,
        // 3D/AR 相关
        has3DModel: ub.badge.has3DModel,
        model3DUrl: ub.badge.model3DUrl || null,
        modelFormat: ub.badge.modelFormat || null,
        hasAR: ub.badge.hasAR,
        arUrl: ub.badge.arUrl || null,
        hasAnimation: ub.badge.hasAnimation,
        animationUrl: ub.badge.animationUrl || null,
        modelConfig: ub.badge.modelConfig
          ? JSON.parse(ub.badge.modelConfig)
          : null,
        event: ub.badge.event,
      },
      ticket: ub.ticket
        ? {
            id: ub.ticket.id,
            ticketCode: ub.ticket.ticketCode,
            status: ub.ticket.status,
          }
        : null,
      order: ub.order
        ? {
            id: ub.order.id,
            status: ub.order.status,
            createdAt: Number(ub.order.createdAt),
          }
        : null,
      obtainedAt: ub.obtainedAt.toISOString(),
      metadata: ub.metadata ? JSON.parse(ub.metadata) : null,
    }));

    // 6️⃣ 统计信息
    const stats = {
      total: collection.length,
      byRarity: {
        legendary: collection.filter((c) => c.badge.rarity === 'legendary')
          .length,
        epic: collection.filter((c) => c.badge.rarity === 'epic').length,
        rare: collection.filter((c) => c.badge.rarity === 'rare').length,
        common: collection.filter((c) => c.badge.rarity === 'common').length,
      },
      byType: {
        badge: collection.filter((c) => c.badge.type === 'badge').length,
        ticket_stub: collection.filter((c) => c.badge.type === 'ticket_stub')
          .length,
        poster: collection.filter((c) => c.badge.type === 'poster').length,
        certificate: collection.filter((c) => c.badge.type === 'certificate')
          .length,
      },
      has3D: collection.filter((c) => c.badge.has3DModel).length,
      hasAR: collection.filter((c) => c.badge.hasAR).length,
    };

    console.log('[COLLECTION] 查询成功:', stats);

    return NextResponse.json({
      ok: true,
      data: collection,
      stats,
    });
  } catch (error: any) {
    console.error('[COLLECTION_ERROR]', error);
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
