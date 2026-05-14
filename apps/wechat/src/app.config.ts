export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/events/index',
    'pages/messages/index',
    'pages/me/index',
    'pages/search/index',
    'pages/login/index',
    'pages/notifications/index',
    // Phase 2a：详情 / 主页 / 关注列表
    'pages/event-detail/index',
    'pages/user-profile/index',
    'pages/user-followers/index',
    // Phase 2b-i：帖子流 + 帖子详情
    'pages/encore/index',
    'pages/post-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#46467A',
    navigationBarTitleText: '票次元',
    navigationBarTextStyle: 'white',
    backgroundColor: '#E0DFFD',
  },
  tabBar: {
    // 暂时使用纯文字 tab（无 iconPath）。Phase 1 后期 / Phase 2 加上正式的 PNG 图标。
    // 微信开发者工具：纯文字 tabBar 会显示一条窄条，编译期不会报错
    color: '#9999AA',
    selectedColor: '#46467A',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '主页' },
      { pagePath: 'pages/events/index', text: '活动' },
      { pagePath: 'pages/search/index', text: '搜索' },
      { pagePath: 'pages/messages/index', text: '消息' },
      { pagePath: 'pages/me/index', text: '我的' },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '票次元会用您的位置推荐附近的活动',
    },
  },
});
