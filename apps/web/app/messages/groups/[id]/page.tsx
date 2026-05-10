"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogOut, Pencil, Save, X } from "lucide-react";
import { apiGet } from "@/lib/api";
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
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/messages/groups/${groupId}`);
      if (data.id) {
        setGroup(data);
        setEditName(data.name || "");
        setEditDesc(data.description || "");
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
    load();
  }, [groupId, load, router]);

  const canEdit = group?.myRole === "owner" || group?.myRole === "admin";

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
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
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
          {group.avatar ? (
            <Image
              src={group.avatar}
              alt={group.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl flex-shrink-0">
              👥
            </div>
          )}
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
                    disabled={saving}
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
        <h2 className="text-sm font-semibold text-[#46467A] mb-3 px-2">
          成员（{group.participants.length}）
        </h2>
        <ul className="divide-y divide-gray-100">
          {group.participants.map((m) => (
            <li key={m.id}>
              <Link
                href={`/u/${m.id}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition"
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
                  className={`text-xs px-2 py-0.5 rounded-full ${
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
            </li>
          ))}
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
    </div>
  );
}
