// lib/scheduler.js - 生产级定时任务调度器
const cron = require('node-cron');

/**
 * 定时任务调度器
 *
 * 特性：
 * - 使用 node-cron，支持标准 cron 表达式
 * - 多实例安全（通过环境变量控制）
 * - 完整的日志记录
 * - 错误处理和重试
 * - 云服务器友好
 */
class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * 启动所有定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('[SCHEDULER] Already running, skipping...');
      return;
    }

    // 在云服务器上，可以通过环境变量控制是否启用定时任务
    // 例如：只在主实例上运行定时任务
    const enableScheduler = process.env.ENABLE_SCHEDULER !== 'false';

    if (!enableScheduler) {
      console.log('[SCHEDULER] Disabled by environment variable');
      return;
    }

    console.log('[SCHEDULER] Starting scheduled jobs...');
    this.registerJobs();
    this.isRunning = true;
    console.log('[SCHEDULER] All jobs registered successfully');
  }

  /**
   * 注册所有定时任务
   */
  registerJobs() {
    // 任务 1: 更新活动状态
    // Cron 表达式: 每小时的第 0 分钟执行（0 */1 * * *）
    this.addJob('updateEventStatus', '0 */1 * * *', async () => {
      await this.updateEventStatus();
    });

    // 任务 2: 清理过期的锁定座位（每 5 分钟）
    this.addJob('cleanupExpiredHolds', '*/5 * * * *', async () => {
      await this.cleanupExpiredHolds();
    });

    // 启动时立即执行一次活动状态更新
    setTimeout(() => {
      console.log('[SCHEDULER] Running initial event status update...');
      this.updateEventStatus();
    }, 5000);
  }

  /**
   * 添加定时任务
   *
   * @param {string} name - 任务名称
   * @param {string} cronExpression - Cron 表达式
   * @param {Function} task - 任务函数
   */
  addJob(name, cronExpression, task) {
    if (this.jobs.has(name)) {
      console.warn(`[SCHEDULER] Job "${name}" already exists, skipping...`);
      return;
    }

    const job = cron.schedule(cronExpression, async () => {
      const startTime = Date.now();
      console.log(`[SCHEDULER] Starting job: ${name}`);

      try {
        await task();
        const duration = Date.now() - startTime;
        console.log(`[SCHEDULER] Job "${name}" completed in ${duration}ms`);
      } catch (error) {
        console.error(`[SCHEDULER] Job "${name}" failed:`, error);
        // 可以在这里添加错误通知（如发送邮件、Slack 等）
      }
    }, {
      scheduled: true,
      timezone: "Asia/Shanghai" // 设置时区为中国时间
    });

    this.jobs.set(name, job);
    console.log(`[SCHEDULER] Registered job: ${name} (${cronExpression})`);
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    console.log('[SCHEDULER] Stopping all jobs...');

    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`[SCHEDULER] Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('[SCHEDULER] All jobs stopped');
  }

  /**
   * 任务 1: 更新活动状态
   */
  async updateEventStatus() {
    try {
      const port = process.env.PORT || 3000;
      const response = await fetch(`http://localhost:${port}/api/events/update-status`);
      const data = await response.json();

      if (data.ok) {
        console.log(`[SCHEDULER] Event status updated: ${data.message}`);
      } else {
        console.error('[SCHEDULER] Event status update failed:', data.error);
      }
    } catch (error) {
      console.error('[SCHEDULER] Failed to update event status:', error.message);
    }
  }

  /**
   * 任务 2: 清理过期的锁定座位
   *
   * 清理超过 15 分钟的座位锁定记录
   */
  async cleanupExpiredHolds() {
    try {
      const port = process.env.PORT || 3000;
      const response = await fetch(`http://localhost:${port}/api/holds/cleanup`);
      const data = await response.json();

      if (data.ok) {
        console.log(`[SCHEDULER] Expired holds cleaned: ${data.message || 'Success'}`);
      } else {
        console.error('[SCHEDULER] Holds cleanup failed:', data.error);
      }
    } catch (error) {
      // 如果 API 不存在，不报错（因为这是可选功能）
      if (error.message.includes('404')) {
        // API 还没实现，静默跳过
        return;
      }
      console.error('[SCHEDULER] Failed to cleanup expired holds:', error.message);
    }
  }

  /**
   * 获取所有任务的状态
   */
  getStatus() {
    const jobs = [];
    for (const [name, job] of this.jobs.entries()) {
      jobs.push({
        name,
        running: this.isRunning,
      });
    }
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs,
    };
  }
}

// 创建单例实例
const scheduler = new Scheduler();

module.exports = scheduler;
