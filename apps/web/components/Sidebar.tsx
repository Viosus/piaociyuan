// components/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from '@/lib/api';

type User = {
  id: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 导航项配置 - 使用自定义图标
  const navItems = [
    {
      name: "主页",
      href: "/events",
      icon: "/icons/search.png",  // 使用搜索图标作为主页
      gradient: "from-purple-500 to-[#EAF353]"
    },
    {
      name: "宇宙信号",
      href: "/signals",
      icon: "/icons/signals.png",
      gradient: "from-[#EAF353] to-[#FFF5FB]"
    },
    {
      name: "安可区",
      href: "/encore",
      icon: "/icons/encore.png",
      gradient: "from-red-500 to-[#EAF353]"
    },
    {
      name: "我的收藏",
      href: "/favorites",
      icon: "/icons/favorites.png",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      name: "我的收藏品",
      href: "/account/collectibles",
      icon: "/icons/achievements.png",
      gradient: "from-purple-500 to-blue-500"
    },
    {
      name: "我的订单",
      href: "/account/orders",
      icon: "/icons/orders.png",
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
    } catch {
      // 静默处理登出API调用失败
    }

    // 清除所有本地存储的数据
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    // 清空用户状态
    setUser(null);
    setShowUserMenu(false);

    // 跳转到首页并刷新页面以清除所有状态
    window.location.href = "/events";
  };

  return (
    <aside className="group fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#46467A] border-r border-[#46467A]/30 flex flex-col z-50 transition-all duration-300 ease-in-out">
      {/* Logo */}
      <Link
        href="/events"
        className="h-20 border-b border-white/20 flex items-center justify-center transition-all duration-300 relative overflow-hidden px-2"
      >
        {/* Logo图标 - 收起时小，展开时大 */}
        <div className="transition-all duration-300 flex justify-center w-full">
          <Image
            src="/icons/logo-gradient.png"
            alt="票次元"
            width={200}
            height={60}
            className="object-contain w-14 h-14 group-hover:w-48 group-hover:h-16 transition-all duration-300"
          />
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
                relative flex items-center py-3 rounded-xl transition-all duration-200
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

              {/* 图标容器 - 收起时居中，展开时靠左 */}
              <span className="w-14 shrink-0 flex items-center justify-center group-hover:w-8 group-hover:ml-4 transition-all duration-300">
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </span>

              {/* 文字 - 展开时显示 */}
              <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto group-hover:ml-3">{item.name}</span>

              {/* 悬浮光效 */}
              {!isActive && (
                <div className={`absolute inset-0 rounded-xl opacity-0 hover:opacity-20 transition-opacity bg-gradient-to-r ${item.gradient} -z-10`}></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="px-3 py-4 border-t border-white/20">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center py-3 rounded-xl hover:bg-white/5 transition-all"
            >
              {/* 头像容器 - 收起时居中，展开时靠左 */}
              <span className="w-14 shrink-0 flex items-center justify-center group-hover:w-10 group-hover:ml-4 transition-all duration-300">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="头像"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-[#46467A] flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10">
                    {user.nickname?.[0] || user.email?.[0] || "U"}
                  </div>
                )}
              </span>

              {/* 用户名 */}
              <div className="text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden w-0 group-hover:w-auto group-hover:ml-3">
                <p className="text-white text-sm font-medium whitespace-nowrap">
                  {user.nickname || user.email || user.phone}
                </p>
                <p className="text-white/40 text-xs whitespace-nowrap">在线</p>
              </div>

              {/* 箭头 */}
              <svg
                className={`shrink-0 text-white/40 transition-all opacity-0 group-hover:opacity-100 w-0 h-0 group-hover:w-4 group-hover:h-4 group-hover:ml-auto group-hover:mr-4 ${showUserMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 用户菜单 */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-56 mb-2 bg-[#46467A] rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
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
                {user.role === 'admin' && (
                  <>
                    <hr className="border-white/20" />
                    <Link
                      href="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-purple-400 hover:bg-white/5 hover:text-purple-300 transition font-medium"
                    >
                      🛡️ 管理后台
                    </Link>
                  </>
                )}
                <hr className="border-white/20" />
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
          <div className="space-y-2 px-1">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center px-4 py-2.5 text-center text-sm font-medium text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all overflow-hidden"
            >
              <span className="group-hover:hidden">👤</span>
              <span className="hidden group-hover:inline">登录</span>
            </Link>
            <Link
              href="/auth/register"
              className="w-full flex items-center justify-center px-4 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-[#EAF353] hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-purple-500/20 overflow-hidden"
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
