import { useState, useCallback } from 'react';

interface UsePaginationOptions<T> {
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 分页 Hook
 * @param options 配置选项
 * @returns 分页状态和方法
 * @example
 * const { data, loading, page, totalPages, goToPage, nextPage, prevPage } = usePagination({
 *   fetchData: async (page, pageSize) => {
 *     const res = await api.getEvents({ page, pageSize });
 *     return { data: res.data, total: res.total };
 *   },
 *   pageSize: 20,
 * });
 */
export function usePagination<T>({
  fetchData,
  pageSize = 20,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);

  const goToPage = useCallback(
    async (targetPage: number) => {
      if (targetPage < 1 || (totalPages > 0 && targetPage > totalPages)) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await fetchData(targetPage, pageSize);

        setData(result.data);
        setTotal(result.total);
        setPage(targetPage);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    },
    [fetchData, pageSize, totalPages]
  );

  const nextPage = useCallback(async () => {
    if (page < totalPages) {
      await goToPage(page + 1);
    }
  }, [page, totalPages, goToPage]);

  const prevPage = useCallback(async () => {
    if (page > 1) {
      await goToPage(page - 1);
    }
  }, [page, goToPage]);

  const refresh = useCallback(async () => {
    await goToPage(page);
  }, [page, goToPage]);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    refresh,
  };
}
