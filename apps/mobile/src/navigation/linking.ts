import { LinkingOptions } from '@react-navigation/native';

/**
 * 深度链接配置
 *
 * URL Scheme: piaociyuan://
 * Universal Links: https://piaociyuan.com/app/*
 */
export const linking: LinkingOptions<any> = {
  prefixes: ['piaociyuan://', 'https://piaociyuan.com/app'],
  config: {
    screens: {
      // 主 Tab 导航
      MainTabs: {
        screens: {
          Home: 'home',
          Events: 'events',
          Encore: 'encore',
          Messages: 'messages',
          Profile: 'profile',
        },
      },

      // 活动相关
      EventDetail: {
        path: 'events/:id',
        parse: {
          id: (id: string) => parseInt(id, 10),
        },
      },
      TierSelection: {
        path: 'events/:eventId/tiers',
        parse: {
          eventId: (id: string) => parseInt(id, 10),
        },
      },

      // 订单相关
      Orders: 'orders',
      OrderDetail: {
        path: 'orders/:id',
        parse: {
          id: (id: string) => parseInt(id, 10),
        },
      },
      Checkout: 'checkout',
      Payment: {
        path: 'payment/:orderId',
        parse: {
          orderId: (id: string) => parseInt(id, 10),
        },
      },
      PaymentSuccess: {
        path: 'payment/success/:orderId',
        parse: {
          orderId: (id: string) => parseInt(id, 10),
        },
      },
      PaymentFailure: {
        path: 'payment/failure/:orderId',
        parse: {
          orderId: (id: string) => parseInt(id, 10),
        },
      },

      // 门票相关
      Tickets: 'tickets',
      TicketDetail: {
        path: 'tickets/:id',
        parse: {
          id: (id: string) => parseInt(id, 10),
        },
      },
      ScanTicket: 'scan',

      // 帖子相关
      PostDetail: {
        path: 'posts/:id',
        parse: {
          id: (id: string) => parseInt(id, 10),
        },
      },
      CreatePost: 'posts/create',

      // 用户相关
      UserProfile: {
        path: 'users/:userId',
        parse: {
          userId: (id: string) => parseInt(id, 10),
        },
      },
      EditProfile: 'profile/edit',
      Settings: 'settings',
      ChangePassword: 'settings/password',
      About: 'about',
      Verification: 'verification',
      FollowingList: {
        path: 'users/:userId/following',
        parse: {
          userId: (id: string) => parseInt(id, 10),
        },
      },
      FollowerList: {
        path: 'users/:userId/followers',
        parse: {
          userId: (id: string) => parseInt(id, 10),
        },
      },
      Favorites: 'favorites',

      // 消息相关
      Chat: {
        path: 'messages/:conversationId',
        parse: {
          conversationId: (id: string) => parseInt(id, 10),
        },
      },
      SelectUser: 'messages/new',

      // NFT 相关
      MyNFTs: 'nfts',
      NFTDetail: {
        path: 'nfts/:nftId',
        parse: {
          nftId: (id: string) => parseInt(id, 10),
        },
      },
      BindWallet: 'wallet/bind',
      MintNFT: 'nft/mint',

      // 通知
      Notifications: 'notifications',

      // 认证
      Login: 'auth/login',
      Register: 'auth/register',
    },
  },
};

/**
 * 创建深度链接 URL
 */
export const createDeepLink = (path: string): string => {
  return `piaociyuan://${path}`;
};

/**
 * 创建 Universal Link URL
 */
export const createUniversalLink = (path: string): string => {
  return `https://piaociyuan.com/app/${path}`;
};

/**
 * 深度链接示例
 */
export const DEEP_LINK_EXAMPLES = {
  // 活动
  eventDetail: (id: number) => createDeepLink(`events/${id}`),
  // 帖子
  postDetail: (id: number) => createDeepLink(`posts/${id}`),
  // 用户
  userProfile: (userId: number) => createDeepLink(`users/${userId}`),
  // 订单
  orderDetail: (id: number) => createDeepLink(`orders/${id}`),
  // 门票
  ticketDetail: (id: number) => createDeepLink(`tickets/${id}`),
  // NFT
  nftDetail: (nftId: number) => createDeepLink(`nfts/${nftId}`),
  // 消息
  chat: (conversationId: number) => createDeepLink(`messages/${conversationId}`),
};
