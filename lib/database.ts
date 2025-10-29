// lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

// 创建数据库连接
let db: Database.Database | null = null;

export function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // 提升性能
  }
  return db;
}

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

export function getAllEvents(): Event[] {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM events ORDER BY date ASC');
  return stmt.all() as Event[];
}

export function getEventById(id: number): Event | undefined {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
  return stmt.get(id) as Event | undefined;
}

// ========== Tier 操作 ==========

export function getTiersByEventId(eventId: number): Tier[] {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM tiers WHERE eventId = ? ORDER BY price ASC');
  return stmt.all(eventId) as Tier[];
}

export function getTierById(id: number): Tier | undefined {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM tiers WHERE id = ?');
  return stmt.get(id) as Tier | undefined;
}

export function updateTierRemaining(id: number, remaining: number): void {
  const db = getDB();
  const stmt = db.prepare('UPDATE tiers SET remaining = ? WHERE id = ?');
  stmt.run(remaining, id);
}

// ========== Hold 操作 ==========

export function createHold(hold: Omit<Hold, 'createdAt'>): void {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO holds (id, eventId, tierId, qty, expireAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    hold.id,
    hold.eventId,
    hold.tierId,
    hold.qty,
    hold.expireAt,
    Date.now().toString()
  );
}

export function getHoldById(id: string): Hold | undefined {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM holds WHERE id = ?');
  return stmt.get(id) as Hold | undefined;
}

export function deleteExpiredHolds(now: number): void {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM holds WHERE CAST(expireAt AS INTEGER) <= ?');
  stmt.run(now);
}

export function deleteHold(id: string): void {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM holds WHERE id = ?');
  stmt.run(id);
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

export function getOrders(filter: OrderFilter = {}) {
  const db = getDB();
  
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
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (eventId) {
    conditions.push('eventId = ?');
    params.push(eventId);
  }
  
  if (searchQuery) {
    conditions.push('id LIKE ?');
    params.push(`%${searchQuery}%`);
  }
  
  if (orderStartDate !== undefined) {
    conditions.push('CAST(createdAt AS INTEGER) >= ?');
    params.push(orderStartDate);
  }
  
  if (orderEndDate !== undefined) {
    conditions.push('CAST(createdAt AS INTEGER) <= ?');
    params.push(orderEndDate);
  }
  
  if (eventIds && eventIds.length > 0) {
    const placeholders = eventIds.map(() => '?').join(',');
    conditions.push(`eventId IN (${placeholders})`);
    params.push(...eventIds);
  }
  
  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  
  // 排序（只支持数据库字段）
  let orderByClause = 'ORDER BY createdAt DESC';
  if (sortBy === 'paidAt') {
    orderByClause = `ORDER BY paidAt ${sortOrder.toUpperCase()}`;
  } else if (sortBy === 'createdAt') {
    orderByClause = `ORDER BY createdAt ${sortOrder.toUpperCase()}`;
  }
  // amount 排序在内存中处理
  
  // 分页
  const offset = (page - 1) * pageSize;
  
  // 查询订单
  const ordersStmt = db.prepare(`
    SELECT * FROM orders
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `);
  const orders = ordersStmt.all(...params, pageSize, offset) as Order[];
  
  // 查询总数
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM orders
    ${whereClause}
  `);
  const { total } = countStmt.get(...params) as { total: number };
  
  return {
    orders,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getOrderById(id: string): Order | undefined {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  return stmt.get(id) as Order | undefined;
}

export function createOrder(order: Order): void {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO orders (id, eventId, tierId, qty, status, createdAt, paidAt, holdId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    order.id,
    order.eventId,
    order.tierId,
    order.qty,
    order.status,
    order.createdAt,
    order.paidAt,
    order.holdId
  );
}

export function updateOrderStatus(id: string, status: string, paidAt?: number): void {
  const db = getDB();
  const stmt = db.prepare(`
    UPDATE orders 
    SET status = ?, paidAt = ?
    WHERE id = ?
  `);
  stmt.run(status, paidAt?.toString() || null, id);
}

// ========== 关闭数据库 ==========

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}