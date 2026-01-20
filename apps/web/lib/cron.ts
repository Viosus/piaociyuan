// lib/cron.ts
/**
 * 定时任务配置
 *
 * 自动更新活动状态
 */

import prisma from './prisma';

let isScheduled = false;

/**
 * 直接更新活动状态（不通过 HTTP 请求）
 */
export async function updateEventStatuses(): Promise<{ updatedCount: number; updates: Array<{ id: number; newStatus: string; reason: string }> }> {
  const now = new Date();

  // 获取所有需要更新状态的活动
  const events = await prisma.event.findMany({
    select: {
      id: true,
      date: true,
      time: true,
      saleStartTime: true,
      saleEndTime: true,
      saleStatus: true,
    },
  });

  const updates: Array<{ id: number; newStatus: string; reason: string }> = [];

  for (const event of events) {
    // 跳过已暂停的活动（手动控制）
    if (event.saleStatus === 'paused') {
      continue;
    }

    let newStatus = event.saleStatus;
    let reason = '';

    // 解析活动日期时间
    const eventDateTime = new Date(`${event.date}T${event.time}`);

    // 规则 1: 活动已结束（活动日期已过）
    if (eventDateTime < now) {
      newStatus = 'ended';
      reason = '活动日期已过';
    }
    // 规则 2: 售票已结束（售票结束时间已过）
    else if (event.saleEndTime && event.saleEndTime < now) {
      newStatus = 'ended';
      reason = '售票时间已过';
    }
    // 规则 3: 售票中（在售票时间范围内）
    else if (
      event.saleStartTime &&
      event.saleStartTime <= now &&
      event.saleEndTime &&
      event.saleEndTime > now
    ) {
      newStatus = 'on_sale';
      reason = '在售票时间内';
    }
    // 规则 4: 未开售（售票开始时间未到）
    else if (event.saleStartTime && event.saleStartTime > now) {
      newStatus = 'not_started';
      reason = '售票未开始';
    }

    // 如果状态需要更新
    if (newStatus !== event.saleStatus) {
      await prisma.event.update({
        where: { id: event.id },
        data: { saleStatus: newStatus },
      });

      updates.push({
        id: event.id,
        newStatus,
        reason,
      });
    }
  }

  return { updatedCount: updates.length, updates };
}

export function startCronJobs() {
  // 防止重复启动
  if (isScheduled) {
    console.log('[CRON] Jobs already scheduled');
    return;
  }

  console.log('[CRON] Starting scheduled jobs...');

  // 每小时更新一次活动状态
  setInterval(async () => {
    try {
      console.log('[CRON] Updating event statuses...');
      const result = await updateEventStatuses();
      console.log('[CRON] Event status update result:', result);
    } catch (error) {
      console.error('[CRON] Failed to update event statuses:', error);
    }
  }, 60 * 60 * 1000); // 每小时执行一次

  // 启动时立即执行一次
  (async () => {
    try {
      console.log('[CRON] Initial event status update...');
      const result = await updateEventStatuses();
      console.log('[CRON] Initial update result:', result);
    } catch (error) {
      console.error('[CRON] Initial update failed:', error);
    }
  })();

  isScheduled = true;
  console.log('[CRON] Scheduled jobs started successfully');
}
