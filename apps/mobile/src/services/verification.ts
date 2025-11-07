import { apiClient } from './api';
import type { ApiResponse } from '@piaoyuzhou/shared';

/**
 * 身份认证相关的 API
 */

/**
 * 认证类型
 */
export type VerificationType = 'celebrity' | 'artist' | 'organizer' | 'official';

/**
 * 认证状态
 */
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/**
 * 认证申请接口
 */
export interface VerificationRequest {
  type: VerificationType;
  realName: string;
  idNumber?: string;
  organization?: string;
  reason: string;
  proofImages: string[];
}

/**
 * 认证申请响应
 */
export interface VerificationResponse {
  id: number;
  userId: number;
  type: VerificationType;
  status: VerificationStatus;
  realName: string;
  idNumber?: string;
  organization?: string;
  reason: string;
  proofImages: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 提交认证申请
 */
export async function submitVerificationRequest(
  data: VerificationRequest
): Promise<ApiResponse<VerificationResponse>> {
  return apiClient.post<VerificationResponse>('/api/user/verification', data);
}

/**
 * 获取当前用户的认证申请状态
 */
export async function getVerificationStatus(): Promise<
  ApiResponse<VerificationResponse | null>
> {
  return apiClient.get<VerificationResponse | null>('/api/user/verification');
}

/**
 * 上传认证证明图片
 */
export async function uploadVerificationImage(
  imageUri: string
): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();

  // 从 URI 中提取文件扩展名
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('image', {
    uri: imageUri,
    name: `verification-${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  return apiClient.post<{ url: string }>(
    '/api/user/verification/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
}

/**
 * 更新用户资料
 */
export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
}

/**
 * 更新用户资料
 */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<any>> {
  return apiClient.put<any>('/api/user/me', data);
}

/**
 * 修改密码
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 修改密码
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/api/user/change-password', data);
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(
  imageUri: string
): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();

  // 从 URI 中提取文件扩展名
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('avatar', {
    uri: imageUri,
    name: `avatar-${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  return apiClient.post<{ url: string }>(
    '/api/user/upload-avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
}
