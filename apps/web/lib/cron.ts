// lib/cron.ts
/**
 * 定时任务配置
 *
 * 自动更新活动状态
 */

let isScheduled = false;

export function startCronJobs() {
  // 防止重复启动
  if (isScheduled) {
    console.log('[CRON] Jobs already scheduled');
    return;
  }

  console.log('[CRON] Starting scheduled jobs...');

  // 每小时更新一次活动状态（在分钟的第 0 分执行）
  setInterval(async () => {
    try {
      console.log('[CRON] Updating event statuses...');
      const response = await fetch('http://localhost:3000/api/events/update-status');
      const data = await response.json();
      console.log('[CRON] Event status update result:', data);
    } catch (error) {
      console.error('[CRON] Failed to update event statuses:', error);
    }
  }, 60 * 60 * 1000); // 每小时执行一次

  // 启动时立即执行一次
  (async () => {
    try {
      console.log('[CRON] Initial event status update...');
      const response = await fetch('http://localhost:3000/api/events/update-status');
      const data = await response.json();
      console.log('[CRON] Initial update result:', data);
    } catch (error) {
      console.error('[CRON] Initial update failed:', error);
    }
  })();

  isScheduled = true;
  console.log('[CRON] Scheduled jobs started successfully');
}
