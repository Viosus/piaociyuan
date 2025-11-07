// 导出 shared 包的类型
export * from '@piaoyuzhou/shared';

// Mobile 特有的类型定义
export interface NavigationParams {
  Home: undefined;
  Events: undefined;
  EventDetail: { eventId: number };
  Tickets: undefined;
  Profile: undefined;
}
