"use client";

import { useEffect, useState } from "react";
import { apiGet, apiUpload } from "@/lib/api";
import { useToast } from "@/components/Toast";

type EventOption = { id: number; name: string };

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const CATEGORY_OPTIONS = [
  { value: "badge", label: "徽章" },
  { value: "ticket_stub", label: "票根" },
  { value: "poster", label: "海报" },
  { value: "certificate", label: "证书" },
  { value: "art", label: "艺术品" },
];

export default function CreateCollectibleDialog({ onClose, onSuccess }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "badge",
    totalSupply: "",
    eventId: "" as string,
    has3DModel: false,
    model3DUrl: "",
    hasAnimation: false,
    animationUrl: "",
  });

  // 拉 events 列表给"关联活动"下拉用
  useEffect(() => {
    apiGet("/api/admin/events?page=1&limit=100")
      .then((data) => {
        if (data.ok) {
          // events 可能在 data.data.events 或 data.data 直接
          const list = data.data?.events || data.data || [];
          setEvents(list.map((e: { id: number; name: string }) => ({ id: e.id, name: e.name })));
        }
      })
      .catch(() => {
        // 静默失败，关联活动是可选项
      });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await apiUpload("/api/upload", file);
      if (res.ok) {
        setFormData({ ...formData, imageUrl: res.data.imageUrl });
      } else {
        toast.error(`上传失败：${res.message || "未知错误"}`);
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 必填校验
    if (!formData.name || !formData.description || !formData.imageUrl ||
        !formData.category || !formData.totalSupply) {
      toast.warning("请填写所有必填字段");
      return;
    }
    const totalSupply = Number(formData.totalSupply);
    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
      toast.warning("总供应量必须是正整数");
      return;
    }
    if (formData.has3DModel && !formData.model3DUrl) {
      toast.warning("启用 3D 模型时需提供模型 URL");
      return;
    }
    if (formData.hasAnimation && !formData.animationUrl) {
      toast.warning("启用动画时需提供动画 URL");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        category: formData.category,
        totalSupply,
        has3DModel: formData.has3DModel,
        hasAnimation: formData.hasAnimation,
      };
      if (formData.eventId) body.eventId = Number(formData.eventId);
      if (formData.has3DModel) body.model3DUrl = formData.model3DUrl;
      if (formData.hasAnimation) body.animationUrl = formData.animationUrl;

      const res = await fetch("/api/admin/collectibles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("收藏品创建成功");
        onSuccess();
      } else {
        toast.error(`创建失败：${data.message || data.error || "未知错误"}`);
      }
    } catch {
      toast.error("创建失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">添加收藏品</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="如：周杰伦演唱会限定徽章"
                maxLength={100}
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="收藏品的故事 / 来源 / 特殊意义..."
                maxLength={500}
              />
            </div>

            {/* 图片 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                展示图片 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-gray-500">上传中...</span>}
              </div>
              {formData.imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="预览"
                    className="w-40 h-40 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 总供应量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总供应量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalSupply}
                  onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="如：500"
                  min="1"
                />
              </div>
            </div>

            {/* 关联活动（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联活动（可选）
              </label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">不关联</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                关联后，该活动的购票用户将自动获得此收藏品
              </p>
            </div>

            {/* 高级：3D 模型 */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.has3DModel}
                  onChange={(e) => setFormData({ ...formData, has3DModel: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">启用 3D 模型</span>
              </label>
              {formData.has3DModel && (
                <input
                  type="text"
                  value={formData.model3DUrl}
                  onChange={(e) => setFormData({ ...formData, model3DUrl: e.target.value })}
                  placeholder="3D 模型 URL（.glb/.gltf）"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              )}
            </div>

            {/* 高级：动画 */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.hasAnimation}
                  onChange={(e) => setFormData({ ...formData, hasAnimation: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">启用动画</span>
              </label>
              {formData.hasAnimation && (
                <input
                  type="text"
                  value={formData.animationUrl}
                  onChange={(e) => setFormData({ ...formData, animationUrl: e.target.value })}
                  placeholder="动画文件 URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              )}
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "创建中..." : "创建收藏品"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
