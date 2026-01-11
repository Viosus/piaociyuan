// lib/inventory.ts
/**
 * 库存管理模块（基于 Ticket 表）
 *
 * 核心逻辑：
 * - 可售票数 = status='available' 的票数
 * - 锁定票数 = status='locked' 的票数
 * - 已售票数 = status='sold' 或 'used' 的票数
 *
 * 防超卖机制：
 * - 使用数据库事务保证原子性
 * - 锁票时先查找可用票，再更新状态
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';
import { TicketStatus } from '@piaoyuzhou/shared';

// ✅ 清理过期 hold（释放锁定的票）
export async function purgeExpiredHolds(nowMs: number): Promise<number> {
  // 查找所有过期的 hold
  const expiredHolds = await prisma.hold.findMany({
    where: {
      expireAt: {
        lte: BigInt(nowMs),
      },
    },
    select: {
      id: true,
    },
  });

  if (expiredHolds.length === 0) {
    return 0;
  }

  const holdIds = expiredHolds.map(h => h.id);

  // 释放这些 hold 锁定的票
  await prisma.ticket.updateMany({
    where: {
      holdId: { in: holdIds },
      status: TicketStatus.HELD,
    },
    data: {
      status: TicketStatus.AVAILABLE,
      holdId: null,
    },
  });

  // 删除过期的 hold
  await prisma.hold.deleteMany({
    where: {
      id: { in: holdIds },
    },
  });

  console.log(`[PURGE_HOLDS] 清理了 ${holdIds.length} 个过期 hold`);
  return holdIds.length;
}

// ✅ 获取活跃锁票数量（status='locked' 且 hold 未过期）
export async function getActiveHoldQty(
  eventId: string,
  tierId: string,
  nowMs: number
): Promise<number> {
  // 先清理过期 hold
  await purgeExpiredHolds(nowMs);

  // 统计 locked 状态的票
  const count = await prisma.ticket.count({
    where: {
      eventId: Number(eventId),
      tierId: Number(tierId),
      status: TicketStatus.HELD,
    },
  });

  return count;
}

// ✅ 获取已售数量（status='sold' 或 'used'）
export async function getPaidQty(eventId: string, tierId: string): Promise<number> {
  const count = await prisma.ticket.count({
    where: {
      eventId: Number(eventId),
      tierId: Number(tierId),
      status: {
        in: [TicketStatus.SOLD, TicketStatus.USED],
      },
    },
  });

  return count;
}

// ✅ 获取可售数量（status='available'）
export async function getAvailableQty(
  eventId: string,
  tierId: string,
  nowMs: number
): Promise<number> {
  // 先清理过期 hold
  await purgeExpiredHolds(nowMs);

  // 统计 available 状态的票
  const count = await prisma.ticket.count({
    where: {
      eventId: Number(eventId),
      tierId: Number(tierId),
      status: TicketStatus.AVAILABLE,
    },
  });

  console.log(
    `[getAvailableQty] eventId=${eventId}, tierId=${tierId}, 可售=${count}`
  );

  return count;
}

// ✅ 获取票档总容量
export async function getTierCapacity(eventId: string, tierId: string): Promise<number> {
  const tier = await prisma.tier.findFirst({
    where: {
      id: Number(tierId),
      eventId: Number(eventId),
    },
  });

  if (!tier) {
    console.error(`[CAPACITY_ERROR] ❌ 未找到票档 eventId=${eventId}, tierId=${tierId}`);
    throw new ApiError(404, 'TIER_NOT_FOUND', '票档不存在，请返回活动页重新选择');
  }

  console.log(
    `[getTierCapacity] ✅ 找到票档 "${tier.name}"`,
    `容量=${tier.capacity}`,
    `价格=¥${tier.price}`
  );

  return tier.capacity;
}

// ✅ 创建 hold（使用悲观锁防止并发问题）
// 🔥 高并发优化：使用 FOR UPDATE SKIP LOCKED
export async function createHoldWithLock(
  eventId: string,
  tierId: string,
  qty: number,
  nowMs: number
): Promise<{ holdId: string; expireAt: number; ticketIds: string[] } | null> {
  const holdId = `H_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const HOLD_MS = 10 * 60 * 1000; // 10 分钟
  const expireAt = nowMs + HOLD_MS;

  try {
    // 使用事务 + 悲观锁保证原子性和并发安全
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1️⃣ 使用原生 SQL + FOR UPDATE SKIP LOCKED 查找并锁定可用的票
      // FOR UPDATE: 对选中的行加排他锁，其他事务无法修改
      // SKIP LOCKED: 跳过已被其他事务锁定的行，避免死锁和等待
      const availableTickets: { id: string; ticketCode: string }[] = await tx.$queryRaw`
        SELECT id, "ticketCode"
        FROM tickets
        WHERE "eventId" = ${Number(eventId)}
          AND "tierId" = ${Number(tierId)}
          AND status = 'available'
        ORDER BY id
        LIMIT ${qty}
        FOR UPDATE SKIP LOCKED
      `;

      // 检查库存是否充足
      if (availableTickets.length < qty) {
        console.warn(
          `[HOLD_REJECT] 库存不足`,
          `eventId=${eventId}, tierId=${tierId}`,
          `请求=${qty}, 可用=${availableTickets.length}`
        );
        return null;
      }

      const ticketIds = availableTickets.map(t => t.id);

      // 2️⃣ 创建 hold 记录
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

      // 3️⃣ 使用原生 SQL 批量更新票状态（性能更好）
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
      `[HOLD_CREATE] ✅ 创建成功（高并发安全）`,
      `holdId=${holdId}`,
      `eventId=${eventId}, tierId=${tierId}`,
      `qty=${qty}`,
      `ticketIds=${result.ticketIds.join(', ')}`,
      `过期时间=${new Date(expireAt).toLocaleString()}`
    );

    return { holdId, expireAt, ticketIds: result.ticketIds };
  } catch (error) {
    console.error('[HOLD_CREATE_ERROR] ❌', error);
    return null;
  }
}

// ✅ 参数校验
export function assertPositiveInt(qty: any, maxQty: number = 10) {
  if (typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
    throw new ApiError(400, 'INVALID_QTY', '购买数量必须为正整数');
  }

  if (qty > maxQty) {
    throw new ApiError(
      400,
      'QTY_LIMIT_EXCEEDED',
      `单次最多购买 ${maxQty} 张`
    );
  }
}

// ✅ 统一错误类
export class ApiError extends Error {
  status: number;
  code: string;
  data?: any;

  constructor(status: number, code: string, message: string, data?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
    this.name = 'ApiError';
  }
}
