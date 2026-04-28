"use client";

import { useState } from "react";
import { apiUpload, apiPut, apiPost, apiDelete } from "@/lib/api";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/lib/eventUtils";

type Tier = {
  id: number;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
  sold: number;
};

type Event = {
  id: number;
  name: string;
  category: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  cover: string;
  artist: string;
  desc: string;
  saleStatus: string;
  saleStartTime: string;
  saleEndTime: string;
  tiers: Tier[];
};

type NewTier = {
  name: string;
  price: number | string;
  capacity: number | string;
};

type Props = {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
};

const CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function formatDatetimeLocal(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventDialog({ event, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: event.name,
    category: event.category,
    city: event.city,
    venue: event.venue,
    date: event.date,
    time: event.time,
    cover: event.cover,
    artist: event.artist,
    desc: event.desc,
    saleStartTime: formatDatetimeLocal(event.saleStartTime),
    saleEndTime: formatDatetimeLocal(event.saleEndTime),
  });

  const [existingTiers, setExistingTiers] = useState<Tier[]>(event.tiers);
  const [newTiers, setNewTiers] = useState<NewTier[]>([]);
  const [tierProcessing, setTierProcessing] = useState<number | null>(null);

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

  // 修改现有票档
  const handleUpdateTier = async (tier: Tier, field: string, value: string) => {
    const updated = existingTiers.map(t =>
      t.id === tier.id ? { ...t, [field]: field === 'name' ? value : Number(value) } : t
    );
    setExistingTiers(updated);
  };

  const handleSaveTier = async (tier: Tier) => {
    setTierProcessing(tier.id);
    try {
      const res = await apiPut(`/api/admin/events/${event.id}/tiers/${tier.id}`, {
        name: tier.name,
        price: tier.price,
        capacity: tier.capacity,
      });
      if (!res.ok) {
        alert(`修改失败: ${res.message}`);
      }
    } catch {
      alert("修改失败");
    } finally {
      setTierProcessing(null);
    }
  };

  const handleDeleteTier = async (tierId: number) => {
    if (!confirm("确定删除该票档？")) return;
    setTierProcessing(tierId);
    try {
      const res = await apiDelete(`/api/admin/events/${event.id}/tiers/${tierId}`);
      if (res.ok) {
        setExistingTiers(existingTiers.filter(t => t.id !== tierId));
      } else {
        alert(`删除失败: ${res.message}`);
      }
    } catch {
      alert("删除失败");
    } finally {
      setTierProcessing(null);
    }
  };

  // 新增票档
  const addNewTier = () => {
    setNewTiers([...newTiers, { name: "", price: "", capacity: "" }]);
  };

  const handleSaveNewTier = async (index: number) => {
    const tier = newTiers[index];
    if (!tier.name || tier.price === "" || tier.capacity === "") {
      alert("请填写完整的票档信息");
      return;
    }
    try {
      const res = await apiPost(`/api/admin/events/${event.id}/tiers`, {
        name: tier.name,
        price: Number(tier.price),
        capacity: Number(tier.capacity),
      });
      if (res.ok) {
        setExistingTiers([...existingTiers, res.data]);
        setNewTiers(newTiers.filter((_, i) => i !== index));
      } else {
        alert(`添加失败: ${res.message}`);
      }
    } catch {
      alert("添加失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.city || !formData.venue || !formData.date ||
        !formData.time || !formData.cover || !formData.artist || !formData.desc ||
        !formData.saleStartTime || !formData.saleEndTime) {
      alert("请填写所有必填字段");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPut(`/api/admin/events/${event.id}`, formData);
      if (res.ok) {
        alert("活动更新成功");
        onSuccess();
      } else {
        alert(`更新失败: ${res.message}`);
      }
    } catch {
      alert("更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">编辑活动</h2>
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
                活动名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
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
                  <img src={formData.cover} alt="封面" className="w-40 h-24 object-cover rounded-lg border" />
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
              />
            </div>

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

            {/* 现有票档管理 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">票档管理</label>
                <button
                  type="button"
                  onClick={addNewTier}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                >
                  + 添加票档
                </button>
              </div>
              <div className="space-y-3">
                {existingTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleUpdateTier(tier, "name", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">¥</span>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => handleUpdateTier(tier, "price", e.target.value)}
                        min="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <input
                      type="number"
                      value={tier.capacity}
                      onChange={(e) => handleUpdateTier(tier, "capacity", e.target.value)}
                      min="1"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">已售{tier.sold}</span>
                    <button
                      type="button"
                      onClick={() => handleSaveTier(tier)}
                      disabled={tierProcessing === tier.id}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(tier.id)}
                      disabled={tierProcessing === tier.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* 新增票档 */}
                {newTiers.map((tier, index) => (
                  <div key={`new-${index}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => {
                        const updated = [...newTiers];
                        updated[index].name = e.target.value;
                        setNewTiers(updated);
                      }}
                      placeholder="票档名称"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">¥</span>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...newTiers];
                          updated[index].price = e.target.value;
                          setNewTiers(updated);
                        }}
                        placeholder="价格"
                        min="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <input
                      type="number"
                      value={tier.capacity}
                      onChange={(e) => {
                        const updated = [...newTiers];
                        updated[index].capacity = e.target.value;
                        setNewTiers(updated);
                      }}
                      placeholder="容量"
                      min="1"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNewTier(index)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTiers(newTiers.filter((_, i) => i !== index))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
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
                {loading ? "保存中..." : "保存修改"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
