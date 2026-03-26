// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeId } from '@/lib/store';
import { verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// ✅ 订单列表查询（支持分页、筛选、搜索、排序）
export async function GET(req: NextRequest) {
  try {
    console.log('[ORDER_LIST] 📋 开始查询订单列表');

    // 验证用户身份
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_TOKEN', message: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    const currentUserId = payload.id;
    console.log('[ORDER_LIST] 当前用户ID:', currentUserId);

    const { searchParams } = new URL(req.url);

    // 📄 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10')));

    // 🔍 筛选参数
    const statusFilter = searchParams.get('status');
    const eventIdFilter = searchParams.get('eventId');
    // userIdFilter 不再从 URL 读取，而是强制使用当前登录用户的 ID
    const qFilter = searchParams.get('q'); // 订单号搜索
    const orderStartDate = searchParams.get('orderStartDate'); // 购票开始日期
    const orderEndDate = searchParams.get('orderEndDate'); // 购票结束日期
    const eventStartDate = searchParams.get('eventStartDate'); // 活动开始日期
    const eventEndDate = searchParams.get('eventEndDate'); // 活动结束日期
    const minAmount = searchParams.get('minAmount'); // 最低金额
    const maxAmount = searchParams.get('maxAmount'); // 最高金额

    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('[ORDER_LIST] 筛选参数:', {
      currentUserId,
      statusFilter,
      eventIdFilter,
      qFilter,
      orderStartDate,
      orderEndDate,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
    });

    // 构建 where 条件
    const where: Prisma.OrderWhereInput = {
      // 强制过滤：只查询当前登录用户的订单
      userId: currentUserId,
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (eventIdFilter) {
      where.eventId = normalizeId(eventIdFilter);
    }

    if (qFilter) {
      where.id = {
        contains: qFilter,
      };
    }

    // 购票日期范围
    if (orderStartDate || orderEndDate) {
      where.createdAt = {};
      if (orderStartDate) {
        where.createdAt.gte = BigInt(new Date(orderStartDate).getTime());
      }
      if (orderEndDate) {
        // 结束日期包含当天，所以加1天
        where.createdAt.lte = BigInt(new Date(orderEndDate).getTime() + 86400000 - 1);
      }
    }

    // 构建排序条件
    let orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (sortBy === 'createdAt' || sortBy === 'paidAt') {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'amount') {
      // 金额排序需要在后端处理，因为amount是计算字段
      orderBy.createdAt = 'desc'; // 先按创建时间排序，后面会在内存中按金额排序
    } else {
      orderBy.createdAt = 'desc';
    }

    // 如果有活动日期或金额筛选，需要查询所有数据后在内存中筛选
    // 否则可以直接使用数据库分页
    const needsMemoryFiltering = eventStartDate || eventEndDate || minAmount || maxAmount || sortBy === 'amount';

    type OrderWithRelations = Prisma.OrderGetPayload<{
      include: {
        tickets: {
          select: {
            id: true;
            ticketCode: true;
            status: true;
            price: true;
            refundedAt: true;
          }
        }
      }
    }>;
    let orders: OrderWithRelations[];
    if (needsMemoryFiltering) {
      // 查询所有满足基础条件的订单（不分页）
      orders = await prisma.order.findMany({
        where,
        orderBy,
        include: {
          tickets: {
            select: {
              id: true,
              ticketCode: true,
              status: true,
              price: true,
              refundedAt: true,
            },
          },
        },
      });
    } else {
      // 使用数据库分页
      orders = await prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          tickets: {
            select: {
              id: true,
              ticketCode: true,
              status: true,
              price: true,
              refundedAt: true,
            },
          },
        },
      });
    }

    console.log(`[ORDER_LIST] ✅ 初始查询结果: ${orders.length} 条`);

    // 批量获取活动和票档信息
    const eventIds = [...new Set(orders.map((o) => parseInt(o.eventId)))];
    const tierIds = [...new Set(orders.map((o) => parseInt(o.tierId)))];

    const [events, tiers] = await Promise.all([
      prisma.event.findMany({
        where: { id: { in: eventIds } },
      }),
      prisma.tier.findMany({
        where: { id: { in: tierIds } },
      }),
    ]);

    const eventMap = new Map(events.map((e) => [String(e.id), e]));
    const tierMap = new Map(tiers.map((t) => [String(t.id), t]));

    // 组装数据
    let result = orders.map((order) => {
      const event = eventMap.get(order.eventId);
      const tier = tierMap.get(order.tierId);
      const amount = tier ? tier.price * order.qty : 0;

      return {
        id: order.id,
        userId: order.userId,
        eventId: Number(order.eventId),
        tierId: Number(order.tierId),
        qty: order.qty,
        status: order.status,
        createdAt: Number(order.createdAt),
        paidAt: order.paidAt ? Number(order.paidAt) : null,
        holdId: order.holdId,
        event: event
          ? {
              id: event.id,
              name: event.name,
              city: event.city,
              date: event.date,
              time: event.time,
            }
          : undefined,
        tier: tier
          ? {
              id: tier.id,
              name: tier.name,
              price: tier.price,
            }
          : undefined,
        amount,
        tickets: order.tickets ? order.tickets.map((t) => ({
          id: t.id,
          ticketCode: t.ticketCode,
          status: t.status,
          price: t.price,
          refundedAt: t.refundedAt,
        })) : [],
      };
    });

    // 活动日期筛选（需要在数据组装后进行）
    if (eventStartDate || eventEndDate) {
      result = result.filter((order) => {
        if (!order.event?.date) return false;
        const eventDate = new Date(order.event.date).getTime();
        if (eventStartDate && eventDate < new Date(eventStartDate).getTime()) {
          return false;
        }
        if (eventEndDate && eventDate > new Date(eventEndDate).getTime() + 86400000 - 1) {
          return false;
        }
        return true;
      });
    }

    // 金额筛选（需要在数据组装后进行）
    if (minAmount || maxAmount) {
      result = result.filter((order) => {
        if (minAmount && order.amount < parseFloat(minAmount)) {
          return false;
        }
        if (maxAmount && order.amount > parseFloat(maxAmount)) {
          return false;
        }
        return true;
      });
    }

    // 金额排序（需要在数据组装后进行）
    if (sortBy === 'amount') {
      result.sort((a, b) => {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      });
    }

    // 如果进行了内存筛选，需要手动分页
    let finalResult = result;
    let total = result.length;
    let totalPages = Math.ceil(total / pageSize);

    if (needsMemoryFiltering) {
      // 手动分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      finalResult = result.slice(startIndex, endIndex);
      console.log(`[ORDER_LIST] 内存筛选后: ${total} 条，返回第 ${page} 页 (${finalResult.length} 条)`);
    } else {
      // 数据库分页，需要重新查询总数
      total = await prisma.order.count({ where });
      totalPages = Math.ceil(total / pageSize);
      console.log(`[ORDER_LIST] 数据库分页: 共 ${total} 条，返回第 ${page} 页 (${finalResult.length} 条)`);
    }

    return NextResponse.json({
      ok: true,
      data: finalResult,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('[ORDER_LIST_ERROR] ❌', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询订单失败',
      },
      { status: 500 }
    );
  }
}

// ✅ 创建订单
export async function POST(req: Request) {
  try {
    const now = Date.now();

    const body = await req.json().catch(() => ({}));
    const { eventId, tierId, qty, holdId, userId } = body || {};

    console.log(`[ORDER_CREATE] 📝 收到创建请求:`, { eventId, tierId, qty, holdId, userId });

    // 参数校验
    if (
      eventId == null ||
      tierId == null ||
      !holdId ||
      !userId ||
      typeof qty !== 'number' ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      console.warn(`[ORDER_CREATE] ❌ 参数校验失败`);
      return NextResponse.json(
        {
          ok: false,
          code: 'BAD_REQUEST',
          message: '请求参数错误，请检查后重试。',
        },
        { status: 400 }
      );
    }

    // 统一 ID 处理
    const normalizedEventId = normalizeId(eventId);
    const normalizedTierId = normalizeId(tierId);
    const normalizedHoldId = normalizeId(holdId);

    // 验证 hold 存在性
    const hold = await prisma.hold.findUnique({
      where: { id: normalizedHoldId },
    });

    if (!hold) {
      console.warn(`[ORDER_CREATE] ❌ hold 不存在：holdId=${normalizedHoldId}`);
      return NextResponse.json(
        {
          ok: false,
          code: 'HOLD_NOT_FOUND',
          message: '锁票不存在，请重新选择票档并下单。',
        },
        { status: 404 }
      );
    }

    // 验证 hold 是否过期
    if (Number(hold.expireAt) <= now) {
      console.warn(`[ORDER_CREATE] ❌ hold 已过期：holdId=${normalizedHoldId}`);
      return NextResponse.json(
        {
          ok: false,
          code: 'HOLD_EXPIRED',
          message: '锁票已过期，请重新选择票档并下单。',
        },
        { status: 410 }
      );
    }

    // 一致性校验
    if (hold.eventId !== normalizedEventId || hold.tierId !== normalizedTierId || hold.qty !== qty) {
      console.warn(`[ORDER_CREATE] ❌ 订单与锁票不一致`);
      return NextResponse.json(
        {
          ok: false,
          code: 'ORDER_HOLD_MISMATCH',
          message: '订单信息与锁票不一致，请返回重新下单。',
        },
        { status: 400 }
      );
    }

    // 创建订单（事务）
    const orderId = `O_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          userId,
          eventId: normalizedEventId,
          tierId: normalizedTierId,
          qty,
          status: 'PENDING',
          createdAt: BigInt(now),
          paidAt: null,
          holdId: normalizedHoldId,
        },
      });

      // 2. 将 hold 锁定的票关联到订单（更新 orderId，清除 holdId）
      await tx.ticket.updateMany({
        where: {
          holdId: normalizedHoldId, // 通过 holdId 查找被锁定的票
          status: 'locked',
        },
        data: {
          orderId, // 更新为真实的订单ID
          holdId: null, // 清除临时的 holdId
        },
      });

      return newOrder;
    });

    console.log(`[ORDER_CREATE] ✅ 订单创建成功：orderId=${orderId}`);

    return NextResponse.json({
      ok: true,
      data: {
        orderId,
        status: 'PENDING',
        createdAt: now,
      },
    });
  } catch (error: unknown) {
    console.error('[ORDER_CREATE_ERROR] ❌', error);

    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_ERROR',
        message: '服务繁忙，请稍后重试。',
      },
      { status: 500 }
    );
  }
}
