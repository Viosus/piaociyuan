"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  color: string;
};

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 从 API 加载 banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await fetch("/api/banners");
        const data = await res.json();
        if (data.ok && data.data.length > 0) {
          setBanners(data.data);
        }
      } catch (error) {
        console.error("加载 Banner 失败:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  // 自动轮播
  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 加载中或没有 banner 时不显示
  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden group">
      {/* 轮播图片 */}
      {banners.map((banner, index) => (
        <Link
          key={banner.id}
          href={banner.link}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* 背景图片 */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.image})` }}
          />

          {/* 渐变遮罩 */}
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.color}`} />

          {/* 内容 */}
          <div className="absolute inset-0 flex items-center justify-center text-center px-8">
            <div className="max-w-3xl">
              <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                {banner.title}
              </h2>
              <p className="text-xl text-white/90 drop-shadow-md">
                {banner.subtitle}
              </p>
              <button className="mt-6 px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                立即查看
              </button>
            </div>
          </div>
        </Link>
      ))}

      {/* 左右切换按钮 */}
      <button
        onClick={(e) => {
          e.preventDefault();
          goToSlide((currentIndex - 1 + banners.length) % banners.length);
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          goToSlide((currentIndex + 1) % banners.length);
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 指示器 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
