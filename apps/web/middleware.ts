import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// 注意：此处是 IP 级粗粒度防刷（防扫号/防爬）。
// 真正的账号级失败退避已下沉到 /api/auth/login 路由内（lib/login-throttle.ts），用 Redis 持久化、跨重启有效、按账号指数退避。
// 因此 login 这里放宽到 30/15分钟，避免同一 NAT 后多个真实用户互相误伤。
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': { maxRequests: 30, windowMs: 15 * 60 * 1000 },
  '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  '/api/auth/send-code': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  '/api/upload': { maxRequests: 20, windowMs: 60 * 1000 },
  'default': { maxRequests: 100, windowMs: 60 * 1000 },
};

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config;
    }
  }
  return RATE_LIMITS['default'];
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip health check
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  const clientIP = getClientIP(request);
  const config = getRateLimitConfig(pathname);
  const rateLimitKey = `${clientIP}:${pathname}`;
  const { allowed, remaining, resetTime } = checkRateLimit(rateLimitKey, config);

  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        message: '请求过于频繁，请稍后再试',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
