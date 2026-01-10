"use client";

import { useEffect, useRef, useState } from 'react';

interface Model3DViewerProps {
  modelUrl: string;
  fallbackImageUrl: string;
  alt: string;
  autoRotate?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function Model3DViewer({
  modelUrl,
  fallbackImageUrl,
  alt,
  autoRotate = false,
  className,
  onLoad,
  onError,
}: Model3DViewerProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModelViewerReady, setIsModelViewerReady] = useState(false);
  const viewerRef = useRef<HTMLElement>(null);

  // 动态加载 model-viewer
  useEffect(() => {
    import('@google/model-viewer')
      .then(() => {
        setIsModelViewerReady(true);
      })
      .catch((err) => {
        console.error('Failed to load model-viewer:', err);
        setError(new Error('Failed to load 3D viewer'));
        onError?.(err);
      });
  }, []);

  // 绑定事件监听
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isModelViewerReady) return;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      const err = new Error('Failed to load 3D model');
      setError(err);
      onError?.(err);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [isModelViewerReady, onLoad, onError]);

  if (error) {
    return (
      <div className={`relative ${className || ''}`}>
        <img
          src={fallbackImageUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => {
            setError(null);
            setIsLoaded(false);
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm hover:bg-black/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重试 3D
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Loading 状态 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[#EAF353] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">加载 3D 模型...</span>
          </div>
        </div>
      )}

      {isModelViewerReady && (
        // @ts-expect-error model-viewer is a web component
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          alt={alt}
          camera-controls=""
          touch-action="pan-y"
          auto-rotate={autoRotate ? "" : undefined}
          shadow-intensity="0.5"
          exposure="1"
          poster={fallbackImageUrl}
          interaction-prompt="auto"
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
      )}

      {/* 操作提示 */}
      {isLoaded && (
        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 text-white/80 rounded-lg text-xs">
          拖动旋转 · 滚轮缩放
        </div>
      )}
    </div>
  );
}
