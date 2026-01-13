"use client";

import { useState } from "react";

type Section = {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  bgGradient: string;
  moreLink: string | null;
  order: number;
  isActive: boolean;
  type: string;
  autoConfig: string | null;
};

type Props = {
  section: Section;
  onClose: () => void;
  onSuccess: () => void;
};

const GRADIENT_OPTIONS = [
  { label: "紫粉渐变", value: "from-purple-50 to-pink-50" },
  { label: "蓝青渐变", value: "from-blue-50 to-cyan-50" },
  { label: "橙红渐变", value: "from-orange-50 to-red-50" },
  { label: "绿蓝渐变", value: "from-green-50 to-teal-50" },
  { label: "黄橙渐变", value: "from-yellow-50 to-amber-50" },
  { label: "靛紫渐变", value: "from-indigo-50 to-purple-50" },
];

export default function EditSectionDialog({ section, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: section.title,
    subtitle: section.subtitle || "",
    icon: section.icon || "",
    bgGradient: section.bgGradient,
    moreLink: section.moreLink || "",
    isActive: section.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert("请输入栏目标题");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/admin/homepage-sections/${section.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          subtitle: formData.subtitle || null,
          icon: formData.icon || null,
          bgGradient: formData.bgGradient,
          moreLink: formData.moreLink || null,
          isActive: formData.isActive,
        })
      });

      const data = await res.json();
      if (data.ok) {
        alert("✅ 栏目更新成功");
        onSuccess();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理更新栏目失败
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
            <h2 className="text-2xl font-bold text-gray-900">编辑栏目</h2>
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
                栏目标题 <span className="text-red-500">*</span>
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
                副标题
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
                图标 Emoji
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                背景渐变
              </label>
              <select
                value={formData.bgGradient}
                onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {GRADIENT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                "查看更多"链接
              </label>
              <input
                type="text"
                value={formData.moreLink}
                onChange={(e) => setFormData({ ...formData, moreLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
                启用此栏目
              </label>
            </div>

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
