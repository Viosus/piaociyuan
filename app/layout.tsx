import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f0f14] text-white`}
      >
        <Sidebar />
        <main className="ml-20 min-h-screen transition-all duration-300">
          {children}
        </main>
      </body>
    </html>
  );
}
