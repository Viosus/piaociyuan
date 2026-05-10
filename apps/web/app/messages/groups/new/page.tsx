"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X, Search } from "lucide-react";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface SearchUser {
  id: string;
  nickname: string;
  avatar: string | null;
  phone?: string;
}

export default function NewGroupPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchUser[]>([]);

  const [creating, setCreating] = useState(false);

  // 检查登录
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login?returnUrl=/messages/groups/new");
    }
  }, [router]);

  // 搜索用户（debounced via simple setTimeout）
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await apiGet(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        // API 返回是数组（不是 {ok,data}）
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        // 静默
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const toggleSelect = (user: SearchUser) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await apiUpload("/api/upload", file);
      if (res.ok) {
        setAvatar(res.data.imageUrl);
      } else {
        toast.error(res.message || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.warning("请输入群名称");
      return;
    }
    if (selected.length === 0) {
      toast.warning("请至少选择 1 个成员");
      return;
    }
    setCreating(true);
    try {
      const res = await apiPost("/api/messages/groups", {
        name: name.trim(),
        description: description.trim() || undefined,
        avatar: avatar || undefined,
        memberIds: selected.map((u) => u.id),
      });
      // groups API 返回 conversation 对象
      if (res && (res.ok ?? true) && (res.data?.id || res.id)) {
        const newId = res.data?.id || res.id;
        toast.success("群聊已创建");
        router.push(`/messages/${newId}`);
      } else {
        toast.error(res?.message || res?.error || "创建失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 -mt-20 pt-24">
      <button
        type="button"
        onClick={() => router.push("/messages")}
        className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-sm text-[#46467A] hover:bg-[#46467A]/10 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" />
        私信
      </button>

      <div className="bg-white border border-[#FFEBF5] rounded-2xl p-6">
        <h1 className="text-xl font-bold text-[#46467A] mb-4">创建群聊</h1>

        {/* 群头像 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
            群头像（可选）
          </label>
          <div className="flex items-center gap-3">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="群头像"
                className="w-16 h-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                👥
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="text-sm"
            />
            {uploadingAvatar && <span className="text-xs text-[#1a1a1f]/40">上传中...</span>}
          </div>
        </div>

        {/* 群名称 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
            群名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：周杰伦演唱会小分队"
            maxLength={30}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A]"
          />
        </div>

        {/* 群简介 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
            群简介（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话介绍这个群"
            rows={2}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] resize-none"
          />
        </div>

        {/* 已选成员 */}
        {selected.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-[#1a1a1f] mb-2">
              已选 {selected.length} 个成员
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#46467A]/10 text-[#46467A] rounded-full text-sm"
                >
                  {u.nickname}
                  <button
                    type="button"
                    onClick={() => toggleSelect(u)}
                    className="hover:bg-[#46467A]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 搜成员 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1a1a1f] mb-1">
            添加成员 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1f]/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜昵称 / 手机号"
              maxLength={30}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A]"
            />
          </div>
          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {searching ? (
                <div className="p-4 text-center text-sm text-[#1a1a1f]/60">搜索中...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#1a1a1f]/60">没找到匹配的用户</div>
              ) : (
                searchResults.map((u) => {
                  const isSelected = selected.some((s) => s.id === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSelect(u)}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition"
                    >
                      {u.avatar ? (
                        <Image
                          src={u.avatar}
                          alt={u.nickname}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {u.nickname[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1a1a1f]">{u.nickname}</p>
                        {u.phone && <p className="text-xs text-[#1a1a1f]/40">{u.phone}</p>}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          isSelected ? "bg-[#46467A] border-[#46467A]" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 提交 */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.length === 0}
            className="flex-1 px-4 py-2.5 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] disabled:opacity-50 transition"
          >
            {creating ? "创建中..." : `创建群聊 (${selected.length + 1})`}
          </button>
        </div>
      </div>
    </div>
  );
}
