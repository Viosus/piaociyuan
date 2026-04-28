"use client";

import { useState } from "react";
import { apiUpload } from "@/lib/api";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/lib/eventUtils";

type TierInput = {
  name: string;
  price: number | string;
  capacity: number | string;
};

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function CreateEventDialog({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "concert" as string,
    city: "",
    venue: "",
    date: "",
    time: "",
    cover: "",
    artist: "",
    desc: "",
    saleStartTime: "",
    saleEndTime: "",
  });
  const [tiers, setTiers] = useState<TierInput[]>([
    { name: "", price: "", capacity: "" },
  ]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await apiUpload("/api/upload", file);
      if (res.ok) {
        setFormData({ ...formData, cover: res.data.imageUrl });
      } else {
        alert(`上传失败: ${res.message}`);
      }
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const addTier = () => {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TierInput, value: string) => {
    const updated = [...tiers];
    if (field === "price" || field === "capacity") {
      updated[index][field] = value;
    } else {
      updated[index][field] = value;
    }
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.city || !formData.venue || !formData.date ||
        !formData.time || !formData.cover || !formData.artist || !formData.desc ||
        !formData.saleStartTime || !formData.saleEndTime) {
      alert("请填写所有必填字段");
      return;
    }

    // 验证票档
    const validTiers = tiers.filter(t => t.name && t.price !== "" && t.capacity !== "");
    if (validTiers.length === 0) {
      alert("请至少添加一个票档");
      return;
    }

    for (const tier of validTiers) {
      if (Number(tier.price) < 0) {
        alert("票档价格不能为负数");
        return;
      }
      if (Number(tier.capacity) <= 0) {
        alert("票档容量必须大于0");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tiers: validTiers.map(t => ({
            name: t.name,
            price: Number(t.price),
            capacity: Number(t.capacity),
          })),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert("活动创建成功");
        onSuccess();
      } else {
        alert(`创建失败: ${data.message}`);
      }
    } catch {
      alert("创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">新建活动</h2>
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
            {/* 基本信息 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活动名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="如：2026周杰伦嘉年华世界巡回演唱会"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  城市 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="如：上海"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                场馆 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="如：梅赛德斯-奔驰文化中心"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  演出日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  演出时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* 封面图片 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-gray-500">上传中...</span>}
              </div>
              {formData.cover && (
                <div className="mt-2">
                  <img
                    src={formData.cover}
                    alt="封面预览"
                    className="w-40 h-24 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                艺人/主办方 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="如：周杰伦"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活动描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="活动介绍..."
              />
            </div>

            {/* 售票时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开售时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.saleStartTime}
                  onChange={(e) => setFormData({ ...formData, saleStartTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  停售时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.saleEndTime}
                  onChange={(e) => setFormData({ ...formData, saleEndTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* 票档管理 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  票档设置 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTier}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                >
                  + 添加票档
                </button>
              </div>
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => updateTier(index, "name", e.target.value)}
                      placeholder="票档名称（如：VIP）"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">¥</span>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updateTier(index, "price", e.target.value)}
                        placeholder="价格"
                        min="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <input
                      type="number"
                      value={tier.capacity}
                      onChange={(e) => updateTier(index, "capacity", e.target.value)}
                      placeholder="容量"
                      min="1"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                disabled={loading || uploading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "创建中..." : "创建活动"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
