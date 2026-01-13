// app/ui/HeroBanners.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  color?: string;
}

export function HeroBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setBanners(data.data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // 静默处理加载横幅失败
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-[#EAF353] to-[#FFE3F0] animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-80"></div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className={`w-full ${currentBanner.color || 'bg-gradient-to-r from-[#EAF353] to-[#FFE3F0]'} relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 文字内容 */}
          <div className="z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="text-lg sm:text-xl text-gray-700 mb-8">
                {currentBanner.subtitle}
              </p>
            )}
            {currentBanner.link && (
              <Link
                href={currentBanner.link}
                className="inline-block px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                了解更多
              </Link>
            )}
          </div>

          {/* 图片 */}
          <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={currentBanner.image}
              alt={currentBanner.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* 指示器 */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-gray-900'
                    : 'w-2 bg-gray-900/30 hover:bg-gray-900/50'
                }`}
                aria-label={`切换到第 ${index + 1} 张轮播图`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
