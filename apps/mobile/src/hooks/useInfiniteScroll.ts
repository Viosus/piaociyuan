import { useState, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number) => Promise<T[]>;
  pageSize?: number;
  initialPage?: number;
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  page: number;
}

/**
 * 无限滚动 Hook
 * @param options 配置选项
 * @returns 无限滚动状态和方法
 * @example
 * const { data, loading, hasMore, loadMore, refresh } = useInfiniteScroll({
 *   fetchData: async (page) => {
 *     const res = await api.getEvents({ page });
 *     return res.data;
 *   },
 *   pageSize: 20,
 * });
 */
export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 20,
  initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const newData = await fetchData(page);

      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, pageSize, loading, hasMore]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(initialPage);
      setHasMore(true);

      const newData = await fetchData(initialPage);

      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData(newData);
      setPage(initialPage + 1);
    } catch (err: any) {
      setError(err.message || '刷新失败');
    } finally {
      setLoading(false);
    }
  }, [fetchData, initialPage, pageSize]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    page,
  };
}
