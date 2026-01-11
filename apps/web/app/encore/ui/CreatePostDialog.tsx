// app/encore/ui/CreatePostDialog.tsx
"use client";

import { useState, useRef } from "react";
import { apiPost, apiUpload } from "@/lib/api";

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
  uploading?: boolean;
  uploadedUrl?: string;
  error?: string;
}

export default function CreatePostDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 9 - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      alert("最多只能上传9张图片");
      return;
    }

    const newImages: ImagePreview[] = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadImages = async (): Promise<{ imageUrl: string; width?: number; height?: number }[]> => {
    const uploadedImages: { imageUrl: string; width?: number; height?: number }[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (img.uploadedUrl) {
        uploadedImages.push({ imageUrl: img.uploadedUrl });
        continue;
      }

      setImages((prev) => {
        const newImages = [...prev];
        newImages[i] = { ...newImages[i], uploading: true, error: undefined };
        return newImages;
      });

      try {
        const result = await apiUpload("/api/upload", img.file);

        if (result.ok && result.data?.imageUrl) {
          uploadedImages.push({ imageUrl: result.data.imageUrl });

          setImages((prev) => {
            const newImages = [...prev];
            newImages[i] = { ...newImages[i], uploading: false, uploadedUrl: result.data.imageUrl };
            return newImages;
          });
        } else {
          throw new Error(result.message || "上传失败");
        }
      } catch (error) {
        setImages((prev) => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i], uploading: false, error: "上传失败" };
          return newImages;
        });
        throw error;
      }
    }

    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("请输入帖子内容");
      return;
    }

    if (content.length > 5000) {
      alert("帖子内容不能超过5000字");
      return;
    }

    setLoading(true);

    try {
      let uploadedImages: { imageUrl: string; width?: number; height?: number }[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages();
      }

      const result = await apiPost("/api/posts", {
        content: content.trim(),
        location: location.trim() || null,
        images: uploadedImages,
      });

      if (result.ok) {
        alert("发布成功！");
        setContent("");
        setLocation("");
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
        onClose();
        onSuccess();
      } else {
        alert(result.message || "发布失败");
      }
    } catch (error) {
      console.error("Create post error:", error);
      alert("发布失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setContent("");
    setLocation("");
    onClose();
  };

  const getCharCountClass = () => {
    return content.length > 4500 ? "text-red-500" : "text-gray-500";
  };

  const getImageClass = (uploading?: boolean) => {
    return "w-full h-full object-cover rounded-lg" + (uploading ? " opacity-50" : "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">发布新帖子</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={loading}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帖子内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] focus:border-transparent resize-none text-gray-800"
              rows={6}
              placeholder="分享你的演出时刻、观后感想..."
              maxLength={5000}
              disabled={loading}
              required
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-500">
                支持表情、换行，分享你的真实感受
              </span>
              <span className={"text-sm " + getCharCountClass()}>
                {content.length} / 5000
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片（可选，最多9张）
            </label>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img.previewUrl}
                    alt={"预览 " + (index + 1)}
                    className={getImageClass(img.uploading)}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  {img.uploadedUrl && !img.uploading && (
                    <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      OK
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      !
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black/80"
                    disabled={loading}
                  >
                    x
                  </button>
                </div>
              ))}

              {images.length < 9 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#EAF353] hover:text-[#d4db4a] transition"
                  disabled={loading}
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs mt-1">添加图片</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={loading}
            />

            <p className="text-xs text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式，单张最大 10MB
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              位置（可选）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] focus:border-transparent text-gray-800"
              placeholder="例如：北京工人体育场、上海梅赛德斯奔驰文化中心..."
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#EAF353] text-gray-900 rounded-lg hover:bg-[#d4db4a] transition disabled:opacity-50 font-medium"
              disabled={loading}
            >
              {loading ? "发布中..." : "发布"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
