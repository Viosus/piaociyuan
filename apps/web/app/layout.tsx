import type { Metadata } from "next";
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

export const metadata = {
  title: "票次元 · 年轻人的追星票务平台",
  description: "一个让追星更便捷、更有仪式感的购票网站",
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
