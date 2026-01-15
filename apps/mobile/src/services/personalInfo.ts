/**
 * 个人信息管理 API 服务
 * 包括证件管理和地址管理
 */

import { apiClient } from './api';

// ============ 类型定义 ============

// 证件类型
export type IdDocumentType = 'china_id' | 'passport' | 'hk_permit' | 'tw_permit';

// 证件类型显示名称
export const ID_TYPE_LABELS: Record<IdDocumentType, string> = {
  china_id: '身份证',
  passport: '护照',
  hk_permit: '港澳通行证',
  tw_permit: '台湾通行证',
};

// 用户证件信息
export interface UserIdDocument {
  id: string;
  userId: string;
  idType: IdDocumentType;
  fullName: string;
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  nationality?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建证件请求
export interface CreateIdDocumentRequest {
  idType: IdDocumentType;
  fullName: string;
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  nationality?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
}

// 更新证件请求
export interface UpdateIdDocumentRequest {
  fullName?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  nationality?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
}

// 地址标签
export type AddressLabel = 'home' | 'work' | 'other';

// 地址标签显示名称
export const ADDRESS_LABEL_LABELS: Record<AddressLabel, string> = {
  home: '家',
  work: '公司',
  other: '其他',
};

// 用户地址信息
export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  country: string;
  province: string;
  city: string;
  district: string;
  street?: string;
  addressDetail: string;
  postalCode?: string;
  label?: AddressLabel;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建地址请求
export interface CreateAddressRequest {
  recipientName: string;
  recipientPhone: string;
  country?: string;
  province: string;
  city: string;
  district: string;
  street?: string;
  addressDetail: string;
  postalCode?: string;
  label?: AddressLabel;
}

// 更新地址请求
export interface UpdateAddressRequest {
  recipientName?: string;
  recipientPhone?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  addressDetail?: string;
  postalCode?: string;
  label?: AddressLabel;
}

// ============ 证件管理 API ============

/**
 * 获取用户所有证件
 */
export async function getIdDocuments() {
  return apiClient.get<UserIdDocument[]>('/api/user/id-documents');
}

/**
 * 获取单个证件详情
 */
export async function getIdDocument(id: string) {
  return apiClient.get<UserIdDocument>(`/api/user/id-documents/${id}`);
}

/**
 * 添加新证件
 */
export async function createIdDocument(data: CreateIdDocumentRequest) {
  return apiClient.post<UserIdDocument>('/api/user/id-documents', data);
}

/**
 * 更新证件信息
 */
export async function updateIdDocument(id: string, data: UpdateIdDocumentRequest) {
  return apiClient.put<UserIdDocument>(`/api/user/id-documents/${id}`, data);
}

/**
 * 删除证件
 */
export async function deleteIdDocument(id: string) {
  return apiClient.delete(`/api/user/id-documents/${id}`);
}

/**
 * 设置默认证件
 */
export async function setDefaultIdDocument(id: string) {
  return apiClient.post<UserIdDocument>(`/api/user/id-documents/${id}/default`);
}

// ============ 地址管理 API ============

/**
 * 获取用户所有地址
 */
export async function getAddresses() {
  return apiClient.get<UserAddress[]>('/api/user/addresses');
}

/**
 * 获取单个地址详情
 */
export async function getAddress(id: string) {
  return apiClient.get<UserAddress>(`/api/user/addresses/${id}`);
}

/**
 * 添加新地址
 */
export async function createAddress(data: CreateAddressRequest) {
  return apiClient.post<UserAddress>('/api/user/addresses', data);
}

/**
 * 更新地址
 */
export async function updateAddress(id: string, data: UpdateAddressRequest) {
  return apiClient.put<UserAddress>(`/api/user/addresses/${id}`, data);
}

/**
 * 删除地址
 */
export async function deleteAddress(id: string) {
  return apiClient.delete(`/api/user/addresses/${id}`);
}

/**
 * 设置默认地址
 */
export async function setDefaultAddress(id: string) {
  return apiClient.post<UserAddress>(`/api/user/addresses/${id}/default`);
}

// ============ 辅助函数 ============

/**
 * 获取格式化的完整地址
 */
export function formatFullAddress(address: UserAddress): string {
  const parts = [
    address.country !== '中国' ? address.country : '',
    address.province,
    address.city,
    address.district,
    address.street,
    address.addressDetail,
  ].filter(Boolean);
  return parts.join('');
}

/**
 * 获取掩码后的证件号码
 */
export function maskIdNumber(idNumber: string, idType: IdDocumentType): string {
  if (!idNumber) return '';

  if (idType === 'china_id') {
    // 身份证显示前6后4
    if (idNumber.length >= 10) {
      return idNumber.slice(0, 6) + '********' + idNumber.slice(-4);
    }
  }

  // 其他证件显示前2后2
  if (idNumber.length >= 4) {
    return idNumber.slice(0, 2) + '****' + idNumber.slice(-2);
  }

  return idNumber;
}

/**
 * 获取默认证件
 */
export function getDefaultDocument(documents: UserIdDocument[]): UserIdDocument | undefined {
  return documents.find(doc => doc.isDefault) || documents[0];
}

/**
 * 获取默认地址
 */
export function getDefaultAddress(addresses: UserAddress[]): UserAddress | undefined {
  return addresses.find(addr => addr.isDefault) || addresses[0];
}
