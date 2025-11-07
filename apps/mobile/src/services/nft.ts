import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * NFT 数字藏品相关的 API
 */

/**
 * NFT 稀有度
 */
export type NFTRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * NFT 类别
 */
export type NFTCategory = 'badge' | 'ticket_stub' | 'poster' | 'certificate' | 'art';

/**
 * NFT 来源类型
 */
export type NFTSourceType = 'ticket_purchase' | 'direct_purchase' | 'airdrop' | 'transfer';

/**
 * 铸造状态
 */
export type MintStatus = 'pending' | 'minting' | 'minted' | 'failed';

/**
 * NFT 数据结构
 */
export interface NFT {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: NFTRarity;
  category: NFTCategory;
  sourceType: NFTSourceType;
  // 3D/AR 相关
  has3DModel: boolean;
  model3DUrl?: string | null;
  modelFormat?: string | null;
  hasAR: boolean;
  arUrl?: string | null;
  hasAnimation: boolean;
  animationUrl?: string | null;
  modelConfig?: any;
  // 供应信息
  totalSupply: number;
  mintedCount: number;
}

/**
 * 用户拥有的 NFT
 */
export interface UserNFT {
  id: number;
  nft: NFT;
  // 所有权信息
  ownerWalletAddress?: string | null;
  contractAddress?: string | null;
  tokenId?: string | null;
  // 铸造信息
  mintStatus: MintStatus;
  isOnChain: boolean;
  mintedAt?: string | null;
  mintTransactionHash?: string | null;
  // 获得方式
  sourceType: NFTSourceType;
  sourceId?: number | null;
  obtainedAt: string;
  // 元数据
  metadata?: any;
  metadataUri?: string | null;
}

/**
 * NFT 统计信息
 */
export interface NFTStats {
  total: number;
  byRarity: {
    legendary: number;
    epic: number;
    rare: number;
    common: number;
  };
  byCategory: {
    badge: number;
    ticket_stub: number;
    poster: number;
    certificate: number;
    art: number;
  };
  byMintStatus: {
    pending: number;
    minting: number;
    minted: number;
    failed: number;
  };
  has3D: number;
  hasAR: number;
  onChain: number;
}

/**
 * NFT 列表响应
 */
export interface NFTListResponse {
  data: UserNFT[];
  stats: NFTStats;
}

/**
 * 获取用户的 NFT 列表
 */
export async function getUserNFTs(params?: {
  rarity?: NFTRarity;
  category?: NFTCategory;
  sourceType?: NFTSourceType;
  mintStatus?: MintStatus;
  isOnChain?: boolean;
}): Promise<ApiResponse<NFTListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.rarity) queryParams.append('rarity', params.rarity);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.sourceType) queryParams.append('sourceType', params.sourceType);
  if (params?.mintStatus) queryParams.append('mintStatus', params.mintStatus);
  if (params?.isOnChain !== undefined) queryParams.append('isOnChain', String(params.isOnChain));

  const query = queryParams.toString();
  return apiClient.get<NFTListResponse>(
    `/api/user/nfts${query ? `?${query}` : ''}`
  );
}

/**
 * 获取单个 NFT 详情
 */
export async function getNFTDetail(id: number): Promise<ApiResponse<UserNFT>> {
  return apiClient.get<UserNFT>(`/api/user/nfts/${id}`);
}

/**
 * 钱包绑定请求
 */
export interface BindWalletRequest {
  walletAddress: string;
  signature: string;
  message: string;
  walletType?: string;
}

/**
 * 钱包绑定响应
 */
export interface BindWalletResponse {
  success: boolean;
  message: string;
  walletAddress: string;
}

/**
 * 绑定钱包地址
 */
export async function bindWallet(
  data: BindWalletRequest
): Promise<ApiResponse<BindWalletResponse>> {
  return apiClient.post<BindWalletResponse>('/api/nft/wallet/bind', data);
}

/**
 * 钱包状态响应
 */
export interface WalletStatusResponse {
  walletAddress: string | null;
  walletConnectedAt: string | null;
  walletProvider: string | null;
  isBound: boolean;
}

/**
 * 获取钱包绑定状态
 */
export async function getWalletStatus(): Promise<ApiResponse<WalletStatusResponse>> {
  return apiClient.get<WalletStatusResponse>('/api/nft/wallet/status');
}

/**
 * 铸造请求
 */
export interface MintNFTRequest {
  orderId: number;
}

/**
 * 铸造响应
 */
export interface MintNFTResponse {
  success: boolean;
  message: string;
  queueId: number;
  estimatedTime: string;
}

/**
 * 请求铸造 NFT
 */
export async function requestMintNFT(
  data: MintNFTRequest
): Promise<ApiResponse<MintNFTResponse>> {
  return apiClient.post<MintNFTResponse>('/api/nft/mint/request', data);
}

/**
 * 铸造状态
 */
export interface MintStatusResponse {
  status: MintStatus;
  message: string;
  transactionHash?: string | null;
  tokenId?: string | null;
  contractAddress?: string | null;
  progress?: number;
  estimatedTime?: string;
}

/**
 * 获取铸造状态
 */
export async function getMintStatus(
  orderId: number
): Promise<ApiResponse<MintStatusResponse>> {
  return apiClient.get<MintStatusResponse>(`/api/nft/mint/status/${orderId}`);
}

/**
 * 可铸造订单列表
 */
export interface MintableOrder {
  id: number;
  event: {
    id: number;
    name: string;
    imageUrl: string;
  };
  tier: {
    id: number;
    name: string;
  };
  qty: number;
  totalAmount: number;
  paidAt: string;
  canMintNFT: boolean;
  nftMinted: boolean;
}

/**
 * 获取可铸造的订单列表
 */
export async function getMintableOrders(): Promise<ApiResponse<MintableOrder[]>> {
  return apiClient.get<MintableOrder[]>('/api/nft/mint/orders');
}

/**
 * NFT 资产详情（链上信息）
 */
export interface NFTAssetDetail {
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  // OpenSea 信息
  openseaUrl: string;
  // 区块链浏览器
  explorerUrl: string;
  // 交易历史
  lastSale?: {
    price: string;
    date: string;
  };
}

/**
 * 获取 NFT 资产详情（链上信息）
 */
export async function getNFTAsset(
  tokenId: string
): Promise<ApiResponse<NFTAssetDetail>> {
  return apiClient.get<NFTAssetDetail>(`/api/nft/assets/${tokenId}`);
}
