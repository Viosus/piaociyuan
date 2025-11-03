// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationDrawer from "./NotificationDrawer";
import { apiGet } from "@/lib/api";

type User = {
  id: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { name: "分类", href: "/categories" },
    { name: "我的账户", href: "/account" },
    { name: "我的订单", href: "/account/orders" },
    { name: "🎨 我的NFT", href: "/account/nfts" },
    { name: "安可区", href: "/encore" },
    { name: "宇宙信号", href: "/signals" },
  ];

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    apiGet("/api/auth/me")
      .then((data) => {
        if (data.ok) {
          setUser(data.data);
          // 获取用户信息后，加载未读通知数
          loadUnreadCount();
        }
      })
      .catch(() => {
        // API helper already handles 401 redirects
        console.error("Failed to load user info");
      });
  }, []);

  // 加载未读通知数
  const loadUnreadCount = async () => {
    try {
      const result = await apiGet('/api/notifications?isRead=false&limit=1');

      if (result.ok) {
        setUnreadCount(result.stats.unread);
      }
    } catch (error) {
      console.error('[LOAD_UNREAD_COUNT_ERROR]', error);
    }
  };

  // 定期刷新未读通知数（每30秒）
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, [user]);

  // 登出
  const handleLogout = () => {
    // 确认提示
    const confirmed = window.confirm("确定要退出登录吗？");
    if (!confirmed) {
      return;
    }

    localStorage.removeItem("token");
    setUser(null);
    setShowUserMenu(false);
    router.push("/events");
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/events" className="text-2xl font-bold text-[#EAF353] hover:text-[#FFB6D9] transition">
            票次元
          </Link>
          <div className="flex items-center gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? "text-[#EAF353] bg-[#FFFAFD]"
                      : "text-[#282828] hover:text-[#EAF353] hover:bg-[#FFFAFD]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* 通知铃铛 - 仅在已登录时显示 */}
            {user && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-[#282828] hover:text-[#EAF353] hover:bg-[#FFFAFD] rounded-lg transition"
                aria-label="通知"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {/* 未读数量徽章 */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* 用户登录状态 */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#282828] hover:text-[#EAF353] hover:bg-[#FFFAFD] rounded-lg transition"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="用户头像"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#FFF5FB] rounded-full flex items-center justify-center text-[#EAF353] font-bold">
                      {user.nickname?.[0] || user.email?.[0] || "U"}
                    </div>
                  )}
                  <span>{user.nickname || user.email || user.phone}</span>
                </button>

                {/* 用户菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      href="/account/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-[#282828] hover:bg-gray-100"
                    >
                      个人设置
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-[#282828] hover:bg-gray-100"
                    >
                      我的账户
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-[#282828] hover:bg-gray-100"
                    >
                      我的订单
                    </Link>
                    <Link
                      href="/account/nfts"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-[#282828] hover:bg-gray-100"
                    >
                      🎨 我的次元
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-[#282828] hover:text-[#EAF353] rounded-lg transition"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#EAF353] hover:bg-[#FFC9E0] rounded-lg transition"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 通知抽屉 */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          // 关闭通知抽屉时，重新加载未读数量
          const token = localStorage.getItem("token");
          if (token) {
            loadUnreadCount();
          }
        }}
      />
    </header>
  );
}
