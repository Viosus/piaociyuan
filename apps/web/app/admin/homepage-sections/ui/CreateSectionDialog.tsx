"use client";

import { useState } from "react";

type Props = {
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

const TYPE_OPTIONS = [
  { label: "手动管理", value: "manual" },
  { label: "自动按分类", value: "auto_category" },
  { label: "自动按状态", value: "auto_status" },
];

const CATEGORY_OPTIONS = [
  { label: "演唱会", value: "concert" },
  { label: "音乐节", value: "festival" },
  { label: "展览", value: "exhibition" },
  { label: "体育赛事", value: "sports" },
  { label: "音乐会", value: "musicale" },
  { label: "演出", value: "show" },
];

export default function CreateSectionDialog({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    icon: "",
    bgGradient: "from-purple-50 to-pink-50",
    moreLink: "",
    type: "manual",
    isActive: true,
    // 自动配置
    autoCategory: "concert",
    autoStatus: "not_started",
    autoLimit: 6,
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

      // 构建请求数据
      const requestData: any = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        icon: formData.icon || null,
        bgGradient: formData.bgGradient,
        moreLink: formData.moreLink || null,
        type: formData.type,
        isActive: formData.isActive,
      };

      // 如果是自动类型，添加自动配置
      if (formData.type === "auto_category") {
        requestData.autoConfig = {
          category: formData.autoCategory,
          limit: formData.autoLimit
        };
      } else if (formData.type === "auto_status") {
        requestData.autoConfig = {
          status: formData.autoStatus,
          limit: formData.autoLimit
        };
      }

      const res = await fetch("/api/admin/homepage-sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await res.json();
      if (data.ok) {
        alert("✅ 栏目创建成功");
        onSuccess();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理创建栏目失败
      alert("❌ 创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">创建新栏目</h2>
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
                placeholder="如：猜你喜欢、演唱会专区"
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
                placeholder="如：根据你的兴趣为你推荐"
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
                placeholder="如：✨、🎤、🎪"
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
                placeholder="如：/signals、/signals?category=concert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                栏目类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 自动配置 */}
            {formData.type === "auto_category" && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动分类
                  </label>
                  <select
                    value={formData.autoCategory}
                    onChange={(e) => setFormData({ ...formData, autoCategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    显示数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.autoLimit}
                    onChange={(e) => setFormData({ ...formData, autoLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.type === "auto_status" && (
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    售票状态
                  </label>
                  <select
                    value={formData.autoStatus}
                    onChange={(e) => setFormData({ ...formData, autoStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="not_started">即将开售</option>
                    <option value="on_sale">售票中</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    显示数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.autoLimit}
                    onChange={(e) => setFormData({ ...formData, autoLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                立即启用此栏目
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
                {loading ? "创建中..." : "创建栏目"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
