// app/api/admin/stats/route.ts
/**
 * 管理员 - 数据统计 API
 *
 * GET /api/admin/stats - 获取仪表盘统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { ok: false, code: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    // 并行查询所有统计数据
    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalOrders,
      ordersByStatus,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({ where: { saleStatus: 'on_sale' } }),
      prisma.order.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, nickname: true } },
        },
      }),
    ]);

    // 计算各状态订单数
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };
    for (const item of ordersByStatus) {
      statusCounts[item.status] = item._count;
    }

    // 计算总收入：获取所有已支付订单，与票档关联计算
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      select: { tierId: true, qty: true, eventId: true },
    });

    const tierIds = [...new Set(paidOrders.map(o => parseInt(o.tierId)))];
    const tiers = await prisma.tier.findMany({
      where: { id: { in: tierIds } },
      select: { id: true, price: true },
    });
    const tierPriceMap = new Map(tiers.map(t => [String(t.id), t.price]));

    let totalRevenue = 0;
    const eventRevenueMap = new Map<string, { revenue: number; orders: number; tickets: number }>();

    for (const order of paidOrders) {
      const price = tierPriceMap.get(order.tierId) || 0;
      const revenue = price * order.qty;
      totalRevenue += revenue;

      const existing = eventRevenueMap.get(order.eventId) || { revenue: 0, orders: 0, tickets: 0 };
      existing.revenue += revenue;
      existing.orders += 1;
      existing.tickets += order.qty;
      eventRevenueMap.set(order.eventId, existing);
    }

    // Top 5 活动
    const topEventIds = [...eventRevenueMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id]) => parseInt(id));

    const topEventDetails = await prisma.event.findMany({
      where: { id: { in: topEventIds } },
      select: { id: true, name: true },
    });
    const eventNameMap = new Map(topEventDetails.map(e => [String(e.id), e.name]));

    const topEvents = topEventIds.map(id => {
      const stats = eventRevenueMap.get(String(id))!;
      return {
        eventId: id,
        eventName: eventNameMap.get(String(id)) || '未知活动',
        totalOrders: stats.orders,
        totalRevenue: stats.revenue,
        ticketsSold: stats.tickets,
      };
    });

    // 格式化最近订单
    const formattedRecentOrders = recentOrders.map(o => ({
      id: o.id,
      status: o.status,
      qty: o.qty,
      createdAt: Number(o.createdAt),
      user: o.user,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        overview: {
          totalUsers,
          totalEvents,
          totalOrders,
          totalRevenue,
          activeEvents,
        },
        ordersByStatus: statusCounts,
        topEvents,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error: unknown) {
    console.error('[ADMIN_STATS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取统计数据失败',
        ...(process.env.NODE_ENV === 'development' && { error: getErrorMessage(error) }),
      },
      { status: 500 }
    );
  }
}
