// Collectible 相关类型
// 对应 Prisma schema:282 和 :324

export type CollectibleCategory =
  | 'badge'
  | 'ticket_stub'
  | 'poster'
  | 'certificate'
  | 'art';

export type CollectibleSourceType = 'ticket_purchase' | 'gift' | 'achievement';

export interface Collectible {
  id: string;                  // UUID
  name: string;
  description: string;
  imageUrl: string;
  category: string;

  eventId: number | null;      // ref Event.id (Int)
  tierId: number | null;       // ref Tier.id (Int)

  has3DModel: boolean;
  model3DUrl: string | null;
  modelFormat: string | null;
  hasAnimation: boolean;
  animationUrl: string | null;
  modelConfig: string | null;

  totalSupply: number;
  claimedCount: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  // 可能附带
  event?: { id: number; name: string; cover: string } | null;
}

export interface UserCollectible {
  id: string;                  // UUID
  userId: string;
  collectibleId: string;
  sourceType: string;
  sourceId: string | null;
  obtainedAt: string;

  // 可能附带
  collectible?: Collectible;
}
