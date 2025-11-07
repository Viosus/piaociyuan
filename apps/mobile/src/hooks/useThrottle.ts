import { useCallback, useRef } from 'react';

/**
 * 节流 Hook
 * @param callback 需要节流的回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 * @example
 * const throttledFn = useThrottle(() => {
 *   console.log('执行函数');
 * }, 1000);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
}
