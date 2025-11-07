import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

interface UseImagePickerResult {
  images: SelectedImage[];
  loading: boolean;
  error: string | null;
  pickImages: (options?: {
    maxImages?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) => Promise<void>;
  takePhoto: (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) => Promise<void>;
  removeImage: (index: number) => void;
  clearImages: () => void;
}

/**
 * 图片选择 Hook
 * @returns 图片选择状态和方法
 * @example
 * const { images, pickImages, takePhoto, removeImage } = useImagePicker();
 *
 * // 从相册选择（最多 9 张）
 * await pickImages({ maxImages: 9 });
 *
 * // 拍照
 * await takePhoto({ allowsEditing: true });
 */
export function useImagePicker(): UseImagePickerResult {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImages = async (options?: {
    maxImages?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('需要相册访问权限');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsMultipleSelection: (options?.maxImages ?? 1) > 1,
        allowsEditing: options?.allowsEditing ?? false,
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
        selectionLimit: options?.maxImages ?? 1,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        }));

        setImages((prev) => {
          const maxImages = options?.maxImages ?? 1;
          const combined = [...prev, ...newImages];
          return combined.slice(0, maxImages);
        });
      }
    } catch (err: any) {
      setError(err.message || '选择图片失败');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // 请求权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('需要相机访问权限');
        return;
      }

      // 拍照
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images' as any,
        allowsEditing: options?.allowsEditing ?? false,
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        };

        setImages((prev) => [...prev, newImage]);
      }
    } catch (err: any) {
      setError(err.message || '拍照失败');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    loading,
    error,
    pickImages,
    takePhoto,
    removeImage,
    clearImages,
  };
}
