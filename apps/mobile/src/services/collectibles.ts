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

export async function getUserCollectibles(page = 1, category?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (category) params.set('category', category);
  const response = await apiClient.get<{ data: CollectiblesListResponse }>(
    `/api/collectibles/my?${params}`
  );
  return response.data;
}

export async function getCollectibleDetail(id: string) {
  const response = await apiClient.get<{ data: Collectible }>(
    `/api/collectibles/${id}`
  );
  return response.data;
}

export async function claimCollectible(collectibleId: string, sourceType = 'ticket_purchase', sourceId?: string) {
  const response = await apiClient.post<{ data: UserCollectible }>(
    '/api/collectibles/claim',
    { collectibleId, sourceType, sourceId }
  );
  return response.data;
}
