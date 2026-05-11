"use client";

/**
 * W-S4 帖子图片 gallery + 键盘导航
 *
 * 两种展示形态：
 * 1. 内联视图：根据外层容器铺满，提供左右切换 + 圆点指示器
 * 2. Lightbox：点击图片后全屏展开，键盘 ←/→ 切图，ESC 关闭
 *
 * 用法：
 *   <ImageGallery
 *     images={post.images}
 *     alt={post.content.substring(0, 50)}
 *   />
 */

import { useEffect, useState, useCallback } from "react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  alt?: string;
  /** 内联视图的图片对象适应方式（默认 contain） */
  objectFit?: "contain" | "cover";
}

export default function ImageGallery({
  images,
  alt = "",
  objectFit = "contain",
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const total = images.length;
  const current = images[currentIndex];

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i === total - 1 ? i : i + 1));
  }, [total]);

  // Lightbox 键盘导航：←/→ 切图，ESC 关闭
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLightboxOpen, goPrev, goNext]);

  // Lightbox 打开时锁滚动条
  useEffect(() => {
    if (!isLightboxOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isLightboxOpen]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white/60">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>无图片</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 内联视图 */}
      <div className="relative w-full h-full">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block w-full h-full cursor-zoom-in"
          aria-label="点击查看大图"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={alt}
            className={`w-full h-full ${
              objectFit === "cover" ? "object-cover" : "object-contain"
            }`}
          />
        </button>

        {total > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                aria-label="上一张"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {currentIndex < total - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
                aria-label="下一张"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm pointer-events-none">
              {currentIndex + 1} / {total}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/70 w-2"
                  }`}
                  aria-label={`切换到第 ${index + 1} 张`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片大图查看"
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* 关闭按钮 - 显眼版（带文字 + 高对比） */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white rounded-full flex items-center gap-1.5 text-foreground font-medium transition z-10 shadow-lg"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">关闭</span>
          </button>

          {/* 计数 */}
          {total > 1 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm pointer-events-none">
              {currentIndex + 1} / {total}
            </div>
          )}

          {/* 图片 */}
          <div
            className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.imageUrl}
              alt={alt}
              className="max-w-full max-h-[95vh] object-contain"
            />
          </div>

          {/* Lightbox 左右切换 */}
          {total > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
                  aria-label="上一张"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {currentIndex < total - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
                  aria-label="下一张"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* 提示文案 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white/80 text-xs select-none pointer-events-none">
            ← → 切换  ·  ESC / 点空白 / 右上角 ✕ 关闭
          </div>
        </div>
      )}
    </>
  );
}
