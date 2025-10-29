process.env.DATABASE_URL = 'file:C:/piaoyuzhou/prisma/dev.db';

// 测试时间戳计算
const orderStartDateStr = "2025-10-29";
const orderEndDateStr = "2025-10-29";

// 新的 UTC 方法
const startTimestamp = Date.UTC(
  parseInt(orderStartDateStr.split('-')[0]),
  parseInt(orderStartDateStr.split('-')[1]) - 1,
  parseInt(orderStartDateStr.split('-')[2]),
  0, 0, 0, 0
);

const endTimestamp = Date.UTC(
  parseInt(orderEndDateStr.split('-')[0]),
  parseInt(orderEndDateStr.split('-')[1]) - 1,
  parseInt(orderEndDateStr.split('-')[2]),
  23, 59, 59, 999
);

console.log('筛选范围：');
console.log(`  开始: ${startTimestamp} (${new Date(startTimestamp).toISOString()})`);
console.log(`  结束: ${endTimestamp} (${new Date(endTimestamp).toISOString()})`);
console.log('');

// 你的订单时间戳
const orderTimestamps = [
  { id: 'O_1761772737316', ts: 1761772737314 },
  { id: 'O_1761772660711', ts: 1761772660708 },
  { id: 'O_1761759962038', ts: 1761759962035 },
  { id: 'O_1761759952947', ts: 1761759952945 },
  { id: 'O_1761759406187', ts: 1761759406183 },
  { id: 'O_1761759060843', ts: 1761759060838 },
];

console.log('订单是否在筛选范围内：');
orderTimestamps.forEach(order => {
  const inRange = order.ts >= startTimestamp && order.ts <= endTimestamp;
  console.log(`  ${order.id}: ${inRange ? '✓ 是' : '✗ 否'} (${new Date(order.ts).toISOString()})`);
});