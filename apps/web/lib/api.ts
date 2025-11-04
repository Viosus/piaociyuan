// lib/api.ts
/**
 * 前端 API 请求工具
 *
 * 功能：
 * - 自动添加 Authorization header
 * - 自动刷新过期的 access token
 * - 401 错误时自动重试
 */

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * 刷新 access token
 */
async function refreshAccessToken(): Promise<string | null> {
  // 如果正在刷新，返回正在进行的 Promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('[REFRESH] 没有 refresh token');
        return null;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const result = await response.json();
        const newAccessToken = result.data.accessToken;

        // 保存新的 access token
        localStorage.setItem('token', newAccessToken);

        console.log('[REFRESH] Token 刷新成功');
        return newAccessToken;
      } else {
        console.log('[REFRESH] Token 刷新失败，需要重新登录');
        // 清除所有 token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return null;
      }
    } catch (error) {
      console.error('[REFRESH] 刷新出错:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 带自动刷新功能的 fetch
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');

  // 添加 Authorization header
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 第一次请求
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // 如果是 401 或 404（可能是路由编译导致），且有 refresh token，尝试刷新
  if (response.status === 401 || (response.status === 404 && url.includes('/api/auth'))) {
    console.log(`[API] 收到 ${response.status}，尝试刷新 token`);

    const newToken = await refreshAccessToken();

    if (newToken) {
      // 用新 token 重试请求
      console.log('[API] 用新 token 重试请求');
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };

      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // 刷新失败，跳转到登录页
      console.log('[API] Token 刷新失败，跳转登录页');
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
      }
    }
  }

  return response;
}

/**
 * GET 请求
 */
export async function apiGet(url: string): Promise<any> {
  const response = await apiFetch(url, {
    method: 'GET',
  });
  return response.json();
}

/**
 * POST 请求
 */
export async function apiPost(url: string, data: any): Promise<any> {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * PUT 请求
 */
export async function apiPut(url: string, data: any): Promise<any> {
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * PATCH 请求
 */
export async function apiPatch(url: string, data?: any): Promise<any> {
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * DELETE 请求
 */
export async function apiDelete(url: string): Promise<any> {
  const response = await apiFetch(url, {
    method: 'DELETE',
  });
  return response.json();
}
