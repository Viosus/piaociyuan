import { NextRequest, NextResponse } from 'next/server';

/**
 * 自家占位图（SVG）。彻底替代外部 placehold.co / unsplash —— 同源、无墙、零延迟。
 *
 * 用法：
 *   /api/placeholder?w=1200&h=800&bg=46467A&fg=ffffff&text=演唱会
 *   /api/placeholder?w=1200&h=800&bg=E91E63&text=Strawberry+Festival
 *
 * 默认 1200×800，紫色底白字。所有参数可选。
 *
 * Cache：immutable（同 URL 永远返回同 SVG），CDN 友好。
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const w = clampInt(sp.get('w'), 1200, 1, 4096);
  const h = clampInt(sp.get('h'), 800, 1, 4096);
  const bg = sanitizeHex(sp.get('bg')) || '46467A';
  const fg = sanitizeHex(sp.get('fg')) || 'ffffff';
  const text = (sp.get('text') || '').slice(0, 80) || 'Image';

  // 字号：宽度的 1/12 但限制在 24-96
  const fontSize = Math.max(24, Math.min(96, Math.round(w / 12)));

  // 文本 XML 转义
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#${bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#${bg}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="#${fg}"
  >${safeText}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeHex(raw: string | null): string | null {
  if (!raw) return null;
  // 只接受 3 / 6 位 hex；不带 #；防 SVG 注入
  if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
    return raw;
  }
  return null;
}
