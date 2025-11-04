// lib/database.ts
// 🔥 已迁移到 PostgreSQL + Prisma，保留此文件以向后兼容
import prisma from './prisma';

// 类型定义
export type Event = {
  id: number;
  name: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  artist: string;
  desc: string;
  createdAt: string;
  updatedAt: string;
};

export type Tier = {
  id: number;
  eventId: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  userId: string;
  eventId: string;
  tierId: string;
  qty: number;
  status: string;
  createdAt: string; // BigInt 作为字符串存储
  paidAt: string | null;
  holdId: string;
};

export type Hold = {
  id: string;
  eventId: string;
  tierId: string;
  qty: number;
  expireAt: string; // BigInt 作为字符串
  createdAt: string;
};

// ========== Event 操作 ==========

export async function getAllEvents(): Promise<Event[]> {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
  });

  return events.map(e => ({
    id: e.id,
    name: e.name,
    city: e.city,
    venue: e.venue,
    date: e.date,
    time: e.time,
    cover: e.cover,
    artist: e.artist,
    desc: e.desc,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) return undefined;

  return {
    id: event.id,
    name: event.name,
    city: event.city,
    venue: event.venue,
    date: event.date,
    time: event.time,
    cover: event.cover,
    artist: event.artist,
    desc: event.desc,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

// ========== Tier 操作 ==========

export async function getTiersByEventId(eventId: number): Promise<Tier[]> {
  const tiers = await prisma.tier.findMany({
    where: { eventId },
    orderBy: { price: 'asc' },
  });

  return tiers.map(t => ({
    id: t.id,
    eventId: t.eventId,
    name: t.name,
    price: t.price,
    capacity: t.capacity,
    remaining: t.remaining,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function getTierById(id: number): Promise<Tier | undefined> {
  const tier = await prisma.tier.findUnique({
    where: { id },
  });

  if (!tier) return undefined;

  return {
    id: tier.id,
    eventId: tier.eventId,
    name: tier.name,
    price: tier.price,
    capacity: tier.capacity,
    remaining: tier.remaining,
    createdAt: tier.createdAt.toISOString(),
    updatedAt: tier.updatedAt.toISOString(),
  };
}

export async function updateTierRemaining(id: number, remaining: number): Promise<void> {
  await prisma.tier.update({
    where: { id },
    data: { remaining },
  });
}

// ========== Hold 操作 ==========

export async function createHold(hold: Omit<Hold, 'createdAt'>): Promise<void> {
  await prisma.hold.create({
    data: {
      id: hold.id,
      eventId: hold.eventId,
      tierId: hold.tierId,
      qty: hold.qty,
      expireAt: BigInt(hold.expireAt),
      createdAt: BigInt(Date.now()),
    },
  });
}

export async function getHoldById(id: string): Promise<Hold | undefined> {
  const hold = await prisma.hold.findUnique({
    where: { id },
  });

  if (!hold) return undefined;

  return {
    id: hold.id,
    eventId: hold.eventId,
    tierId: hold.tierId,
    qty: hold.qty,
    expireAt: hold.expireAt.toString(),
    createdAt: hold.createdAt.toString(),
  };
}

export async function deleteExpiredHolds(now: number): Promise<void> {
  await prisma.hold.deleteMany({
    where: {
      expireAt: {
        lte: BigInt(now),
      },
    },
  });
}

export async function deleteHold(id: string): Promise<void> {
  await prisma.hold.delete({
    where: { id },
  });
}

// ========== Order 操作 ==========

export type OrderFilter = {
  status?: string;
  eventId?: string;
  searchQuery?: string;
  orderStartDate?: number;
  orderEndDate?: number;
  eventIds?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
};

export async function getOrders(filter: OrderFilter = {}) {
  const {
    status,
    eventId,
    searchQuery,
    orderStartDate,
    orderEndDate,
    eventIds,
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filter;

  // 构建 WHERE 条件
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (eventId) {
    where.eventId = eventId;
  }

  if (searchQuery) {
    where.id = {
      contains: searchQuery,
    };
  }

  if (orderStartDate !== undefined || orderEndDate !== undefined) {
    where.createdAt = {};
    if (orderStartDate !== undefined) {
      where.createdAt.gte = BigInt(orderStartDate);
    }
    if (orderEndDate !== undefined) {
      where.createdAt.lte = BigInt(orderEndDate);
    }
  }

  if (eventIds && eventIds.length > 0) {
    where.eventId = {
      in: eventIds,
    };
  }

  // 排序
  const orderBy: any = {};
  if (sortBy === 'paidAt') {
    orderBy.paidAt = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  // 分页
  const skip = (page - 1) * pageSize;

  // 查询订单
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(order => ({
      id: order.id,
      eventId: order.eventId,
      tierId: order.tierId,
      qty: order.qty,
      status: order.status,
      createdAt: order.createdAt.toString(),
      paidAt: order.paidAt?.toString() || null,
      holdId: order.holdId,
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) return undefined;

  return {
    id: order.id,
    userId: order.userId,
    eventId: order.eventId,
    tierId: order.tierId,
    qty: order.qty,
    status: order.status,
    createdAt: order.createdAt.toString(),
    paidAt: order.paidAt?.toString() || null,
    holdId: order.holdId,
  };
}

export async function createOrder(order: Order): Promise<void> {
  await prisma.order.create({
    data: {
      id: order.id,
      userId: order.userId,
      eventId: order.eventId,
      tierId: order.tierId,
      qty: order.qty,
      status: order.status,
      createdAt: BigInt(order.createdAt),
      paidAt: order.paidAt ? BigInt(order.paidAt) : null,
      holdId: order.holdId,
    },
  });
}

export async function updateOrderStatus(id: string, status: string, paidAt?: number): Promise<void> {
  await prisma.order.update({
    where: { id },
    data: {
      status,
      paidAt: paidAt ? BigInt(paidAt) : null,
    },
  });
}

// ========== Prisma 自动管理连接，无需手动关闭 ==========