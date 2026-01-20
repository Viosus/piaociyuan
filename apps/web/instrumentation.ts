// instrumentation.ts
// Next.js 服务器启动时的初始化钩子

export async function register() {
  // 只在 Node.js 运行时启动（不在 Edge 运行时）
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronJobs } = await import('./lib/cron');
    startCronJobs();
  }
}
