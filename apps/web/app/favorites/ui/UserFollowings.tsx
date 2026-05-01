"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

type User = {
  id: string;
  nickname: string;
  avatar?: string;
  isVerified: boolean;
  verifiedType?: string;
  followerCount: number;
  followingCount: number;
  bio?: string;
};

type Following = {
  id: string;
  followedAt: string;
  user: User;
};

export default function UserFollowings() {
  const router = useRouter();
  const toast = useToast();
  const [followings, setFollowings] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadFollowings();
  }, [page]);

  const loadFollowings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("请先登录");
        return;
      }

      const res = await fetch(`/api/user/following?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "加载失败");
      }

      setFollowings(data.data.followings);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string, nickname: string) => {
    if (!confirm(`确定要取消关注「${nickname}」吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // 从列表中移除
        setFollowings((prev) => prev.filter((f) => f.user.id !== userId));
        setTotalCount((prev) => prev - 1);
        toast.success("已取消关注");
      } else {
        toast.error(data.message || "取消关注失败");
      }
    } catch {
      toast.error("网络错误，请稍后重试");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-[#FFEBF5]">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => loadFollowings()}
          className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 统计信息 */}
      <div className="mb-6 bg-white rounded-lg p-4 border border-[#FFEBF5]">
        <div className="text-2xl font-bold text-purple-500">{totalCount}</div>
        <div className="text-sm text-gray-600">关注的用户</div>
      </div>

      {followings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#FFEBF5]">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-600 mb-4">你还没有关注任何用户</p>
          <Link
            href="/encore"
            className="inline-block px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
          >
            去安可区看看
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {followings.map((following) => (
              <div
                key={following.id}
                className="bg-white rounded-lg border border-[#FFEBF5] p-4 hover:border-[#FFE3F0] hover:shadow-lg transition"
              >
                {/* 用户信息 */}
                <div className="flex items-start gap-3 mb-3">
                  <Link href={`/u/${following.user.id}`}>
                    {following.user.avatar ? (
                      <img
                        src={following.user.avatar}
                        alt={following.user.nickname}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg font-bold ring-2 ring-gray-100">
                        {following.user.nickname[0]}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/u/${following.user.id}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="font-medium text-gray-900 truncate hover:text-purple-600 transition">
                          {following.user.nickname}
                        </h3>
                        {following.user.isVerified && (
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{following.user.followerCount} 粉丝</span>
                      <span>{following.user.followingCount} 关注</span>
                    </div>
                  </div>
                </div>

                {/* 简介 */}
                {following.user.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {following.user.bio}
                  </p>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Link
                    href={`/u/${following.user.id}`}
                    className="flex-1 text-center px-4 py-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition text-sm"
                  >
                    查看主页
                  </Link>
                  <button
                    onClick={() => handleUnfollow(following.user.id, following.user.nickname)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:border-red-500 hover:text-red-500 transition text-sm"
                  >
                    取消关注
                  </button>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  关注时间：{formatDate(following.followedAt)}
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                上一页
              </button>
              <span className="text-gray-600">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
