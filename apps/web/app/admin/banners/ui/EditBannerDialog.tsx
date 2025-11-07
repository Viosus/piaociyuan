"use client";

import { useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  color: string;
  order: number;
  isActive: boolean;
};

type Props = {
  banner: Banner;
  onClose: () => void;
  onSuccess: () => void;
};

const GRADIENT_OPTIONS = [
  { label: "紫粉渐变", value: "from-purple-600/80 to-pink-600/80" },
  { label: "蓝青渐变", value: "from-blue-600/80 to-cyan-600/80" },
  { label: "橙红渐变", value: "from-orange-600/80 to-red-600/80" },
  { label: "绿蓝渐变", value: "from-green-600/80 to-teal-600/80" },
  { label: "黄橙渐变", value: "from-yellow-600/80 to-amber-600/80" },
  { label: "靛紫渐变", value: "from-indigo-600/80 to-purple-600/80" },
];

export default function EditBannerDialog({ banner, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: banner.title,
    subtitle: banner.subtitle,
    image: banner.image,
    link: banner.link,
    color: banner.color,
    isActive: banner.isActive
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subtitle || !formData.image || !formData.link) {
      alert("请填写所有必填字段");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.ok) {
        alert("✅ Banner 更新成功");
        onSuccess();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("更新 Banner 失败:", error);
      alert("❌ 更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">编辑 Banner</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                副标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                跳转链接 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                渐变遮罩
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {GRADIENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                启用此 Banner
              </label>
            </div>

            {/* 预览 */}
            {formData.image && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">预览</label>
                <div className="relative w-full h-40 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${formData.image})` }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${formData.color}`} />
                  <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {formData.title}
                      </h3>
                      <p className="text-white/90 drop-shadow-md mt-1">
                        {formData.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "保存中..." : "保存更改"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
