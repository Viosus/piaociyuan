import { apiClient } from './api';

export interface Collectible {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  has3DModel: boolean;
  model3DUrl: string | null;
  modelFormat: string | null;
  hasAnimation: boolean;
  animationUrl: string | null;
  totalSupply: number;
  claimedCount: number;
  isActive: boolean;
  event?: { id: number; name: string; cover: string } | null;
}

export interface UserCollectible {
  id: string;
  obtainedAt: string;
  sourceType: string;
  sourceId: string | null;
  collectible: Collectible;
}

export interface CollectiblesListResponse {
  items: UserCollectible[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 注意：apiClient.get/post 返回 ApiResponse<T>，response.data 已经是 T，不要再包一层 { data: T }

export async function getUserCollectibles(page = 1, category?: string): Promise<CollectiblesListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (category) params.set('category', category);
  const response = await apiClient.get<CollectiblesListResponse>(
    `/api/collectibles/my?${params}`
  );
  return response.data ?? { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
}

export async function getCollectibleDetail(id: string): Promise<Collectible | null> {
  const response = await apiClient.get<Collectible>(`/api/collectibles/${id}`);
  return response.data ?? null;
}

export async function claimCollectible(collectibleId: string, sourceType = 'ticket_purchase', sourceId?: string): Promise<UserCollectible | null> {
  const response = await apiClient.post<UserCollectible>(
    '/api/collectibles/claim',
    { collectibleId, sourceType, sourceId }
  );
  return response.data ?? null;
}
