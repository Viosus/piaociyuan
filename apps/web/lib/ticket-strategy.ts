// lib/ticket-strategy.ts
/**
 * 票务购买策略（参考大麦网机制）
 *
 * 核心逻辑：
 * 1. 开售初期（高并发）：强制自动分配（SKIP LOCKED）
 * 2. 开售后期（低并发）：支持手动选座（乐观锁）
 * 3. 自动根据时间和并发度切换
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

// 策略配置
const STRATEGY_CONFIG = {
  // 开售后多少分钟内强制自动分配
  AUTO_ASSIGN_MINUTES: 10,

  // 高并发阈值：每分钟超过多少次请求就强制自动分配
  HIGH_CONCURRENCY_THRESHOLD: 100,

  // 座位锁定时长
  HOLD_DURATION_MS: 10 * 60 * 1000, // 10 分钟
};

// 购票模式
export type TicketMode = 'AUTO' | 'MANUAL';

/**
 * 判断当前应该使用哪种购票模式
 */
export async function determineTicketMode(
  eventId: string,
  tierId: string
): Promise<TicketMode> {
  try {
    // 1. 检查活动开售时间
    const tier = await prisma.tier.findFirst({
      where: {
        id: Number(tierId),
        eventId: Number(eventId),
      },
      include: {
        event: true,
      },
    });

    if (!tier || !tier.event) {
      return 'AUTO'; // 默认自动分配
    }

    // 2. 计算距离开售的时间（假设活动日期即开售日期）
    const saleStartTime = new Date(`${tier.event.date} ${tier.event.time}`).getTime();
    const now = Date.now();
    const minutesSinceSaleStart = (now - saleStartTime) / (1000 * 60);

    // 3. 开售后 N 分钟内强制自动分配
    if (minutesSinceSaleStart < STRATEGY_CONFIG.AUTO_ASSIGN_MINUTES) {
      console.log(
        `[TICKET_STRATEGY] 开售 ${minutesSinceSaleStart.toFixed(1)} 分钟内，强制自动分配`
      );
      return 'AUTO';
    }

    // 4. 检查当前并发度（可选）
    // 统计最近 1 分钟内的锁票数量
    const oneMinuteAgo = BigInt(now - 60 * 1000);
    const recentHolds = await prisma.hold.count({
      where: {
        eventId,
        tierId,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    // 高并发时强制自动分配
    if (recentHolds > STRATEGY_CONFIG.HIGH_CONCURRENCY_THRESHOLD) {
      console.log(
        `[TICKET_STRATEGY] 当前并发高（${recentHolds} 次/分钟），强制自动分配`
      );
      return 'AUTO';
    }

    // 5. 低并发时允许手动选座
    console.log(
      `[TICKET_STRATEGY] 低并发状态（${recentHolds} 次/分钟），允许手动选座`
    );
    return 'MANUAL';
  } catch (error) {
    console.error('[TICKET_STRATEGY_ERROR]', error);
    return 'AUTO'; // 出错时默认自动分配
  }
}

/**
 * 自动分配座位（高性能，使用 SKIP LOCKED）
 */
export async function autoAssignSeats(
  eventId: string,
  tierId: string,
  qty: number,
  nowMs: number
): Promise<{ holdId: string; expireAt: number; ticketIds: string[] } | null> {
  const holdId = `H_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expireAt = nowMs + STRATEGY_CONFIG.HOLD_DURATION_MS;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 使用 FOR UPDATE SKIP LOCKED 跳过被锁定的票
      const availableTickets: { id: string; ticketCode: string; seatNumber: string | null }[] = await tx.$queryRaw`
        SELECT id, "ticketCode", "seatNumber"
        FROM tickets
        WHERE "eventId" = ${Number(eventId)}
          AND "tierId" = ${Number(tierId)}
          AND status = 'available'
        ORDER BY "seatNumber" NULLS LAST, id
        LIMIT ${qty}
        FOR UPDATE SKIP LOCKED
      `;

      if (availableTickets.length < qty) {
        console.warn(
          `[AUTO_ASSIGN] 库存不足 eventId=${eventId}, tierId=${tierId}, 请求=${qty}, 可用=${availableTickets.length}`
        );
        return null;
      }

      const ticketIds = availableTickets.map(t => t.id);

      // 创建 hold 记录
      await tx.hold.create({
        data: {
          id: holdId,
          eventId,
          tierId,
          qty,
          createdAt: BigInt(nowMs),
          expireAt: BigInt(expireAt),
        },
      });

      // 锁定票
      await tx.$executeRaw`
        UPDATE tickets
        SET status = 'locked', "holdId" = ${holdId}
        WHERE id = ANY(${ticketIds}::text[])
      `;

      return { ticketIds };
    });

    if (!result) {
      return null;
    }

    console.log(
      `[AUTO_ASSIGN] ✅ 自动分配成功 holdId=${holdId}, 座位=${result.ticketIds.join(', ')}`
    );

    return { holdId, expireAt, ticketIds: result.ticketIds };
  } catch (error) {
    console.error('[AUTO_ASSIGN_ERROR]', error);
    return null;
  }
}

/**
 * 手动选座（用户指定座位）
 */
export async function manualSelectSeats(
  eventId: string,
  tierId: string,
  specificSeatIds: string[],
  nowMs: number
): Promise<{ holdId: string; expireAt: number; ticketIds: string[] } | null> {
  const holdId = `H_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expireAt = nowMs + STRATEGY_CONFIG.HOLD_DURATION_MS;
  const qty = specificSeatIds.length;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 尝试锁定指定的座位（乐观锁，不等待）
      const lockedTickets: { id: string }[] = await tx.$queryRaw`
        UPDATE tickets
        SET status = 'locked', "holdId" = ${holdId}
        WHERE id = ANY(${specificSeatIds}::text[])
          AND "eventId" = ${Number(eventId)}
          AND "tierId" = ${Number(tierId)}
          AND status = 'available'
        RETURNING id
      `;

      // 检查是否所有座位都锁定成功
      if (lockedTickets.length < qty) {
        const lockedIds = lockedTickets.map(t => t.id);
        const failedSeats = specificSeatIds.filter(id => !lockedIds.includes(id));

        console.warn(
          `[MANUAL_SELECT] 部分座位已被抢 eventId=${eventId}, tierId=${tierId}, ` +
          `成功=${lockedIds.join(', ')}, 失败=${failedSeats.join(', ')}`
        );

        // 回滚：释放已锁定的座位
        if (lockedIds.length > 0) {
          await tx.$executeRaw`
            UPDATE tickets
            SET status = 'available', "holdId" = NULL
            WHERE id = ANY(${lockedIds}::text[])
          `;
        }

        return { success: false, failedSeats };
      }

      // 所有座位都锁定成功，创建 hold
      await tx.hold.create({
        data: {
          id: holdId,
          eventId,
          tierId,
          qty,
          createdAt: BigInt(nowMs),
          expireAt: BigInt(expireAt),
        },
      });

      return { success: true, ticketIds: lockedTickets.map(t => t.id) };
    });

    if (!result.success) {
      return null;
    }

    console.log(
      `[MANUAL_SELECT] ✅ 手动选座成功 holdId=${holdId}, 座位=${result.ticketIds?.join(', ') || '无'}`
    );

    return { holdId, expireAt, ticketIds: result.ticketIds || [] };
  } catch (error) {
    console.error('[MANUAL_SELECT_ERROR]', error);
    return null;
  }
}

/**
 * 统一的购票入口（自动判断模式）
 */
export async function holdTickets(params: {
  eventId: string;
  tierId: string;
  qty?: number;              // 自动分配时需要
  specificSeatIds?: string[]; // 手动选座时需要
}): Promise<{
  success: boolean;
  mode: TicketMode;
  holdId?: string;
  expireAt?: number;
  ticketIds?: string[];
  error?: string;
}> {
  const { eventId, tierId, qty, specificSeatIds } = params;
  const nowMs = Date.now();

  // 1. 判断当前应该使用哪种模式
  const mode = await determineTicketMode(eventId, tierId);

  // 2. 根据模式执行不同逻辑
  if (mode === 'AUTO' || !specificSeatIds) {
    // 自动分配模式
    if (!qty || qty <= 0) {
      return { success: false, mode, error: '请指定购买数量' };
    }

    const result = await autoAssignSeats(eventId, tierId, qty, nowMs);
    if (!result) {
      return { success: false, mode, error: '库存不足或系统繁忙' };
    }

    return {
      success: true,
      mode,
      holdId: result.holdId,
      expireAt: result.expireAt,
      ticketIds: result.ticketIds,
    };
  } else {
    // 手动选座模式
    const result = await manualSelectSeats(eventId, tierId, specificSeatIds, nowMs);
    if (!result) {
      return { success: false, mode, error: '部分座位已被抢，请重新选择' };
    }

    return {
      success: true,
      mode,
      holdId: result.holdId,
      expireAt: result.expireAt,
      ticketIds: result.ticketIds,
    };
  }
}

/**
 * 获取座位实时状态（用于前端显示）
 */
export async function getSeatStatus(eventId: string, tierId: string) {
  const tickets = await prisma.ticket.findMany({
    where: {
      eventId: Number(eventId),
      tierId: Number(tierId),
    },
    select: {
      id: true,
      ticketCode: true,
      seatNumber: true,
      status: true,
      holdId: true,
    },
    orderBy: [
      { seatNumber: 'asc' },
      { ticketCode: 'asc' },
    ],
  });

  // 获取 hold 的过期时间
  const holdIds = tickets
    .filter(t => t.holdId)
    .map(t => t.holdId as string);

  const holds = await prisma.hold.findMany({
    where: {
      id: { in: holdIds },
    },
    select: {
      id: true,
      expireAt: true,
    },
  });

  const holdMap = new Map(holds.map(h => [h.id, Number(h.expireAt)]));
  const now = Date.now();

  // 组装座位状态
  return tickets.map(ticket => {
    let status: 'available' | 'locked' | 'sold';
    let lockExpireAt: number | null = null;

    if (ticket.status === 'sold' || ticket.status === 'used') {
      status = 'sold';
    } else if (ticket.status === 'locked' && ticket.holdId) {
      const expireAt = holdMap.get(ticket.holdId);
      if (expireAt && expireAt > now) {
        status = 'locked';
        lockExpireAt = expireAt;
      } else {
        // hold 已过期，实际是可用的
        status = 'available';
      }
    } else {
      status = 'available';
    }

    return {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      seatNumber: ticket.seatNumber || ticket.ticketCode, // 使用 seatNumber，如果没有则用 ticketCode
      status,
      lockExpireAt,
      remainingSeconds: lockExpireAt ? Math.max(0, Math.floor((lockExpireAt - now) / 1000)) : null,
    };
  });
}
