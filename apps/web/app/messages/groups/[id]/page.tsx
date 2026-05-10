"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogOut, Pencil, Save, X, UserPlus, Search, UserMinus } from "lucide-react";
import { apiGet, apiUpload } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";

interface GroupMember {
  id: string;
  nickname: string;
  avatar: string | null;
  isVerified: boolean;
  role: "owner" | "admin" | "member";
  nickname_in_group?: string;
  isMuted?: boolean;
  joinedAt: string;
}

interface GroupDetail {
  id: string;
  type: "group";
  name: string;
  avatar: string | null;
  description: string | null;
  creatorId: string;
  memberCount: number;
  maxMembers: number;
  myRole: "owner" | "admin" | "member";
  participants: GroupMember[];
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "群主",
  admin: "管理员",
  member: "成员",
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  // "添加成员" modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<Array<{ id: string; nickname: string; avatar: string | null; phone?: string }>>([]);
  const [addSelected, setAddSelected] = useState<Array<{ id: string; nickname: string }>>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/messages/groups/${groupId}`);
      if (data.id) {
        setGroup(data);
        setEditName(data.name || "");
        setEditDesc(data.description || "");
        setEditAvatar(data.avatar || "");
      } else {
        toast.error(data.error || "群聊不存在");
        router.push("/messages");
      }
    } catch {
      toast.error("加载失败");
      router.push("/messages");
    } finally {
      setLoading(false);
    }
  }, [groupId, router, toast]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push(`/auth/login?returnUrl=/messages/groups/${groupId}`);
      return;
    }
    // 推断当前用户 id（用于隐藏自己的"移除"按钮）
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) setCurrentUserId(String(u.id));
      }
    } catch {
      // ignore
    }
    load();
  }, [groupId, load, router]);

  // 搜成员 debounce（添加成员 modal）
  useEffect(() => {
    if (!showAddModal) return;
    if (addQuery.trim().length < 2) {
      setAddResults([]);
      return;
    }
    setAddSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await apiGet(`/api/users/search?q=${encodeURIComponent(addQuery.trim())}`);
        setAddResults(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        setAddSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addQuery, showAddModal]);

  const canEdit = group?.myRole === "owner" || group?.myRole === "admin";

  // ===== 头像上传 =====
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await apiUpload("/api/upload", file);
      if (res.ok) {
        setEditAvatar(res.data.imageUrl);
      } else {
        toast.error(res.message || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ===== 添加成员 =====
  const toggleAddSelect = (u: { id: string; nickname: string }) => {
    setAddSelected((prev) =>
      prev.find((x) => x.id === u.id)
        ? prev.filter((x) => x.id !== u.id)
        : [...prev, { id: u.id, nickname: u.nickname }]
    );
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddQuery("");
    setAddResults([]);
    setAddSelected([]);
  };

  const handleAddMembers = async () => {
    if (addSelected.length === 0) {
      toast.warning("请至少选择 1 个成员");
      return;
    }
    setAddSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/messages/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ memberIds: addSelected.map((u) => u.id) }),
      });
      const data = await res.json();
      if (res.ok && (data.ok ?? true)) {
        toast.success(`已添加 ${addSelected.length} 位成员`);
        closeAddModal();
        load();
      } else {
        toast.error(data.error || data.message || "添加失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ===== 踢人 =====
  const handleRemoveMember = async (member: GroupMember) => {
    const ok = await confirm({
      title: "移除成员",
      message: `确定移除「${member.nickname}」吗？该成员将无法继续接收群消息。`,
      confirmText: "移除",
      cancelText: "再想想",
      danger: true,
    });
    if (!ok) return;

    setRemovingId(member.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/messages/groups/${groupId}/members?memberId=${encodeURIComponent(member.id)}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();
      if (res.ok && (data.ok ?? true)) {
        toast.success(`已移除 ${member.nickname}`);
        load();
      } else {
        toast.error(data.error || data.message || "移除失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setRemovingId(null);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.warning("群名不能为空");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/messages/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          avatar: editAvatar || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok || data.id) {
        toast.success("已保存");
        setEditing(false);
        load();
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    const isOwner = group.myRole === "owner";
    const ok = await confirm({
      title: isOwner ? "解散群聊" : "退出群聊",
      message: isOwner
        ? `确定解散"${group.name}"吗？解散后所有成员将被移出，对话记录无法恢复。`
        : `确定退出"${group.name}"吗？退出后将看不到此群的消息。`,
      confirmText: isOwner ? "解散" : "退出",
      cancelText: "再想想",
      danger: true,
    });
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const url = isOwner
        ? `/api/messages/groups/${groupId}`
        : `/api/messages/groups/${groupId}/leave`;
      const res = await fetch(url, {
        method: isOwner ? "DELETE" : "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(isOwner ? "群聊已解散" : "已退出群聊");
        router.push("/messages");
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch {
      toast.error("网络错误");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46467A]" />
      </div>
    );
  }
  if (!group) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 -mt-20 pt-24">
      <button
        type="button"
        onClick={() => router.push(`/messages/${groupId}`)}
        className="inline-flex items-center gap-1 px-3 py-1.5 mb-4 text-sm text-[#46467A] hover:bg-[#46467A]/10 rounded-full transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回群聊
      </button>

      {/* 群信息 */}
      <div className="bg-white border border-[#FFEBF5] rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-4">
          {/* 头像区：编辑模式下可上传 */}
          <div className="flex-shrink-0">
            {(editing ? editAvatar : group.avatar) ? (
              <Image
                src={(editing ? editAvatar : group.avatar) as string}
                alt={group.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl">
                👥
              </div>
            )}
            {editing && (
              <label className="block mt-2">
                <span className="sr-only">上传头像</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="text-xs w-full"
                />
                {uploadingAvatar && (
                  <span className="text-xs text-[#1a1a1f]/40">上传中...</span>
                )}
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A]"
                  placeholder="群名"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A] resize-none text-sm"
                  placeholder="群简介（可选）"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploadingAvatar}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#46467A] text-white rounded-lg text-sm hover:bg-[#5A5A8E] disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditName(group.name);
                      setEditDesc(group.description || "");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <X className="w-3 h-3" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-[#1a1a1f]">{group.name}</h1>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="p-1 text-[#1a1a1f]/40 hover:text-[#46467A] transition"
                      aria-label="编辑群信息"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#1a1a1f]/60 mb-2">
                  {group.memberCount} / {group.maxMembers} 成员
                </p>
                {group.description && (
                  <p className="text-sm text-[#1a1a1f]/80 whitespace-pre-wrap">
                    {group.description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 成员列表 */}
      <div className="bg-white border border-[#FFEBF5] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-sm font-semibold text-[#46467A]">
            成员（{group.participants.length}）
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[#46467A] text-white rounded-full hover:bg-[#5A5A8E] transition"
            >
              <UserPlus className="w-3 h-3" />
              添加成员
            </button>
          )}
        </div>
        <ul className="divide-y divide-gray-100">
          {group.participants.map((m) => {
            const canRemove =
              canEdit && m.role !== "owner" && m.id !== currentUserId;
            const removing = removingId === m.id;
            return (
            <li key={m.id} className="flex items-center gap-2 p-2">
              <Link
                href={`/u/${m.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 rounded-lg transition px-1"
              >
                {m.avatar ? (
                  <Image
                    src={m.avatar}
                    alt={m.nickname}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {m.nickname?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1a1a1f] truncate">
                      {m.nickname_in_group || m.nickname}
                    </span>
                    {m.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    m.role === "owner"
                      ? "bg-yellow-100 text-yellow-700"
                      : m.role === "admin"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ROLE_LABEL[m.role] || m.role}
                </span>
              </Link>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m)}
                  disabled={removing}
                  title={`移除 ${m.nickname}`}
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </li>
            );
          })}
        </ul>
      </div>

      {/* 危险操作 */}
      <button
        type="button"
        onClick={handleLeave}
        className="w-full px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition inline-flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        {group.myRole === "owner" ? "解散群聊" : "退出群聊"}
      </button>

      {/* 添加成员 Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={closeAddModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#46467A]">添加成员</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="p-1 text-[#1a1a1f]/40 hover:text-[#1a1a1f] transition"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1f]/40" />
                <input
                  type="text"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="搜昵称 / 手机号"
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46467A]"
                  autoFocus
                />
              </div>
              {addSelected.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {addSelected.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#46467A]/10 text-[#46467A] rounded-full text-xs"
                    >
                      {u.nickname}
                      <button
                        type="button"
                        onClick={() => toggleAddSelect(u)}
                        className="hover:bg-[#46467A]/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {addQuery.trim().length < 2 ? (
                <p className="text-sm text-[#1a1a1f]/40 text-center py-6">
                  输入至少 2 个字符开始搜索
                </p>
              ) : addSearching ? (
                <p className="text-sm text-[#1a1a1f]/60 text-center py-6">搜索中...</p>
              ) : addResults.length === 0 ? (
                <p className="text-sm text-[#1a1a1f]/60 text-center py-6">
                  没找到匹配的用户
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {addResults.map((u) => {
                    const isSelected = addSelected.some((s) => s.id === u.id);
                    const isAlreadyMember = group.participants.some(
                      (p) => p.id === u.id
                    );
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => !isAlreadyMember && toggleAddSelect(u)}
                          disabled={isAlreadyMember}
                          className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                            {u.phone && (
                              <p className="text-xs text-[#1a1a1f]/40">{u.phone}</p>
                            )}
                          </div>
                          {isAlreadyMember ? (
                            <span className="text-xs text-[#1a1a1f]/40">已在群</span>
                          ) : (
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
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={closeAddModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddMembers}
                disabled={addSubmitting || addSelected.length === 0}
                className="flex-1 px-4 py-2 bg-[#46467A] text-white rounded-xl hover:bg-[#5A5A8E] disabled:opacity-50 transition"
              >
                {addSubmitting ? "添加中..." : `添加 ${addSelected.length} 人`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
