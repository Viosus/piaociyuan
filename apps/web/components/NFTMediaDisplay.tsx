"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 3D 查看器，禁用 SSR
const Model3DViewer = dynamic(() => import('./Model3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="w-8 h-8 border-4 border-[#EAF353] border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

interface NFTMediaDisplayProps {
  has3DModel: boolean;
  model3DUrl?: string | null;
  imageUrl: string;
  name: string;
  className?: string;
}

export default function NFTMediaDisplay({
  has3DModel,
  model3DUrl,
  imageUrl,
  name,
  className,
}: NFTMediaDisplayProps) {
  const [show3D, setShow3D] = useState(has3DModel && !!model3DUrl);

  // 3D 模式
  if (show3D && model3DUrl) {
    return (
      <div className={`relative ${className || ''}`}>
        <Model3DViewer
          modelUrl={model3DUrl}
          fallbackImageUrl={imageUrl}
          alt={name}
          className="w-full h-full"
          onError={() => setShow3D(false)}
        />

        {/* 切换到图片按钮 */}
        <button
          onClick={() => setShow3D(false)}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm hover:bg-black/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          图片
        </button>
      </div>
    );
  }

  // 图片模式
  return (
    <div className={`relative ${className || ''}`}>
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
      />

      {/* 3D 查看按钮（仅当有 3D 模型时显示） */}
      {has3DModel && model3DUrl && (
        <button
          onClick={() => setShow3D(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          3D 查看
        </button>
      )}
    </div>
  );
}
