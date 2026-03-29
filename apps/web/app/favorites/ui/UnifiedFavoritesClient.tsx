"use client";

import { useState } from "react";
import EventFavorites from "./EventFavorites";
import PostFavorites from "./PostFavorites";
import UserFollowings from "./UserFollowings";

export default function UnifiedFavoritesClient() {
  const [activeTab, setActiveTab] = useState<"events" | "posts" | "users">("events");

  return (
    <div className="min-h-screen px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#46467A] via-[#E0DFFD] to-blue-400 bg-clip-text text-transparent">
            ⭐ 我的收藏
          </h1>
          <p className="text-gray-500 text-sm">
            管理你收藏的活动、帖子和关注的用户
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("events")}
            className={`pb-3 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === "events"
                ? "text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🎫</span>
              <span>关注的活动</span>
            </span>
            {activeTab === "events" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-3 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === "posts"
                ? "text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📌</span>
              <span>收藏的帖子</span>
            </span>
            {activeTab === "posts" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === "users"
                ? "text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>👥</span>
              <span>关注的用户</span>
            </span>
            {activeTab === "users" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            )}
          </button>
        </div>

        {/* 内容区 */}
        {activeTab === "events" && <EventFavorites />}
        {activeTab === "posts" && <PostFavorites />}
        {activeTab === "users" && <UserFollowings />}
      </div>
    </div>
  );
}
