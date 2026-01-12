import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import SearchBar from "@/components/SearchBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viewport 配置 - 移动端优化
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#C72471",
};

export const metadata: Metadata = {
  title: "票次元 · 年轻人的追星票务平台",
  description: "一个让追星更便捷、更有仪式感的购票网站",
  // 基础 meta
  applicationName: "票次元",
  authors: [{ name: "票次元团队" }],
  keywords: ["票务", "演唱会", "音乐节", "追星", "购票"],
  // 移动端优化
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  // Apple 设备优化
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "票次元",
  },
  // 其他设备优化
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#C72471",
    "msapplication-tap-highlight": "no",
    "HandheldFriendly": "true",
    "MobileOptimized": "width",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <Sidebar />
        <RightSidebar />
        {/* 搜索栏 - 固定在右上角 */}
        <div className="fixed top-6 z-40 transition-all duration-300" style={{ right: 'calc(var(--right-sidebar-width, 64px) + 1.5rem)' }}>
          <SearchBar />
        </div>
        <div className="ml-20 h-screen overflow-y-auto transition-all duration-300 pt-20" style={{ marginRight: 'var(--right-sidebar-width, 64px)' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
