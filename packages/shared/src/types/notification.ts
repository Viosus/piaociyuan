// Notification 类型
// 对应 Prisma schema:569

export type NotificationTypeValue = 'system' | 'order' | 'event' | 'social';

export interface Notification {
  id: string;                  // UUID
  userId: string;
  type: string;
  title: string;
  content: string;
  eventId: number | null;      // ref Event.id (Int)
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
