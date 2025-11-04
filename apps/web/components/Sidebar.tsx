// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from '@/lib/api';

type User = {
  id: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 导航项配置
  const navItems = [
    {
      name: "主页",
      href: "/events",
      icon: "🏠",
      gradient: "from-purple-500 to-[#EAF353]"
    },
    {
      name: "宇宙信号",
      href: "/signals",
      icon: "📡",
      gradient: "from-[#EAF353] to-[#FFF5FB]0"
    },
    {
      name: "安可区",
      href: "/encore",
      icon: "🔥",
      gradient: "from-red-500 to-[#EAF353]"
    },
    {
      name: "我关注的",
      href: "/account/favorites",
      icon: "⭐",
      gradient: "from-[#EAF353] to-[#FFC9E0]"
    },
    {
      name: "我的次元",
      href: "/account/nfts",
      icon: "💎",
      gradient: "from-purple-500 to-blue-500"
    },
    {
      name: "我的订单",
      href: "/account/orders",
      icon: "🎫",
      gradient: "from-orange-500 to-red-500"
    },
  ];

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    apiGet("/api/auth/me")
      .then((data) => {
        if (data.ok) {
          setUser(data.data);
        }
      })
      .catch(() => {
        // API helper already handles 401 redirects
      });
  }, []);

  // 登出
  const handleLogout = async () => {
    const confirmed = window.confirm("确定要退出登录吗？");
    if (!confirmed) return;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // 调用登出API撤销会话
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {
          // 即使API调用失败也继续登出
        });
      }
    } catch (error) {
      console.error('登出API调用失败:', error);
    }

    // 清除所有本地存储的数据
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    // 清空用户状态
    setUser(null);
    setShowUserMenu(false);

    // 跳转到首页并刷新页面以清除所有状态
    router.push("/events");

    // 延迟刷新，确保路由跳转完成
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <aside className="group fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#EAF353] border-r border-[#FFE3F0] flex flex-col z-50 transition-all duration-300 ease-in-out">
      {/* Logo */}
      <Link
        href="/events"
        className="h-20 border-b border-[#FFE3F0]/30 flex items-center justify-center group-hover:justify-start group-hover:px-6 transition-all duration-300 relative"
      >
        {/* Logo图标 - 仅收起时显示 */}
        <div className="group-hover:opacity-0 group-hover:scale-0 opacity-100 scale-100 transition-all duration-300 absolute">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-3xl">🎫</span>
          </div>
        </div>

        {/* 文字 - 仅展开时显示 */}
        <div className="opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 whitespace-nowrap">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent">
            票次元
          </h1>
          <p className="text-xs text-white/40">Ticketing Reimagined</p>
        </div>
      </Link>

      {/* 导航菜单 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center py-3 rounded-xl transition-all duration-200 justify-center group-hover:justify-start group-hover:gap-3 group-hover:px-3
                ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {/* 激活指示器 */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${item.gradient} rounded-r-full`}></div>
              )}

              {/* 图标 - 始终显示，收起时完全居中 */}
              <span className="text-2xl min-w-[2rem] shrink-0 flex items-center justify-center">{item.icon}</span>

              {/* 文字 - 展开时显示 */}
              <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto">{item.name}</span>

              {/* 悬浮光效 */}
              {!isActive && (
                <div className={`absolute inset-0 rounded-xl opacity-0 hover:opacity-20 transition-opacity bg-gradient-to-r ${item.gradient} -z-10`}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="px-3 py-4 border-t border-[#FFE3F0]/30">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center py-3 rounded-xl hover:bg-white/5 transition-all justify-center group-hover:justify-start group-hover:gap-3 group-hover:px-3"
            >
              {/* 头像 */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="头像"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 min-w-[2.5rem] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 min-w-[2.5rem] shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-[#EAF353] flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10">
                  {user.nickname?.[0] || user.email?.[0] || "U"}
                </div>
              )}

              {/* 用户名 */}
              <div className="text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto">
                <p className="text-white text-sm font-medium whitespace-nowrap">
                  {user.nickname || user.email || user.phone}
                </p>
                <p className="text-white/40 text-xs whitespace-nowrap">在线</p>
              </div>

              {/* 箭头 */}
              <svg
                className={`shrink-0 text-white/40 transition-all opacity-0 group-hover:opacity-100 w-0 h-0 group-hover:w-4 group-hover:h-4 ${showUserMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 用户菜单 */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-56 mb-2 bg-[#FFE3F0] rounded-xl border border-[#FFEBF5] shadow-2xl overflow-hidden z-50">
                <Link
                  href="/account"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition"
                >
                  👤 个人中心
                </Link>
                <Link
                  href="/account/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition"
                >
                  ⚙️ 偏好设置
                </Link>
                <hr className="border-[#FFEBF5]" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition"
                >
                  🚪 退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 flex flex-col items-center group-hover:items-stretch">
            <Link
              href="/auth/login"
              className="w-10 h-10 group-hover:w-full flex items-center justify-center group-hover:px-4 group-hover:py-2.5 text-center text-sm font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all overflow-hidden"
            >
              <span className="group-hover:hidden">👤</span>
              <span className="hidden group-hover:inline">登录</span>
            </Link>
            <Link
              href="/auth/register"
              className="w-10 h-10 group-hover:w-full flex items-center justify-center group-hover:px-4 group-hover:py-2.5 text-center text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-[#EAF353] hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-purple-500/20 overflow-hidden"
            >
              <span className="group-hover:hidden">✨</span>
              <span className="hidden group-hover:inline">注册</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
