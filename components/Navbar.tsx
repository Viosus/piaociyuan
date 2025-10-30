// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const navItems = [
    { name: "分类", href: "/categories" },
    { name: "我的账户", href: "/account" },
    { name: "我的订单", href: "/account/orders" },
    { name: "我的收藏", href: "/account/collection" },
    { name: "安可区", href: "/encore" },
    { name: "宇宙信号", href: "/signals" },
  ];

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setUser(data.data);
        } else {
          // Token 无效，清除
          localStorage.removeItem("token");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, []);

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
          <Link href="/events" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition">
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
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* 用户登录状态 */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="用户头像"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      个人设置
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      我的账户
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      我的订单
                    </Link>
                    <Link
                      href="/account/collection"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎨 我的收藏
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg transition"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
