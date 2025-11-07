import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

export type PermissionType = 'camera' | 'mediaLibrary';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface UsePermissionResult {
  status: PermissionStatus | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<PermissionStatus>;
}

/**
 * 权限请求 Hook
 * @param type 权限类型
 * @returns 权限状态和方法
 * @example
 * const { status, requestPermission } = usePermission('camera');
 *
 * const granted = await requestPermission();
 * if (granted) {
 *   // 执行需要权限的操作
 * }
 */
export function usePermission(type: PermissionType): UsePermissionResult {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      let result;

      switch (type) {
        case 'camera':
          result = await Camera.getCameraPermissionsAsync();
          break;
        case 'mediaLibrary':
          result = await ImagePicker.getMediaLibraryPermissionsAsync();
          break;
        default:
          throw new Error(`Unknown permission type: ${type}`);
      }

      const permissionStatus = result.granted
        ? 'granted'
        : result.canAskAgain
        ? 'undetermined'
        : 'denied';

      setStatus(permissionStatus);
      return permissionStatus;
    } catch (err: any) {
      setError(err.message || '检查权限失败');
      return 'denied';
    }
  }, [type]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      let result;

      switch (type) {
        case 'camera':
          result = await Camera.requestCameraPermissionsAsync();
          break;
        case 'mediaLibrary':
          result = await ImagePicker.requestMediaLibraryPermissionsAsync();
          break;
        default:
          throw new Error(`Unknown permission type: ${type}`);
      }

      const permissionStatus = result.granted
        ? 'granted'
        : result.canAskAgain
        ? 'undetermined'
        : 'denied';

      setStatus(permissionStatus);
      return result.granted;
    } catch (err: any) {
      setError(err.message || '请求权限失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [type]);

  return {
    status,
    loading,
    error,
    requestPermission,
    checkPermission,
  };
}
