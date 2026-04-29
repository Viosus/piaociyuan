import '@react-navigation/native';

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Home: undefined;
      Events: { category?: string } | undefined;
      Encore: undefined;
      Tickets: undefined;
      Profile: undefined;

      Login: undefined;
      Register: undefined;

      MainTabs: undefined;
      EventDetail: { eventId?: string | number; id?: string | number } | undefined;
      Checkout: any;
      Payment: any;
      TicketDetail: any;
      Orders: undefined;
      OrderDetail: { orderId?: string; id?: string } | undefined;
      Favorites: undefined;
      EditProfile: undefined;
      Verification: undefined;
      Settings: undefined;
      FollowingList: { userId?: string } | undefined;
      FollowerList: { userId?: string } | undefined;
      TransferTicket: any;
      ReceiveTransfer: any;
      CreatePost: any;
      PostDetail: { postId?: string; id?: string } | undefined;
      UserProfile: { userId?: string | number } | undefined;
      Conversations: undefined;
      Chat: { conversationId?: string; isGroup?: boolean; groupName?: string; userId?: string } | undefined;
      SelectUser: any;
      CreateGroup: any;
      GroupDetail: any;
      IdDocuments: undefined;
      AddIdDocument: any;
      Addresses: undefined;
      AddAddress: any;
      MyCollectibles: undefined;
      CollectibleDetail: any;
      TierSelection: any;
      PaymentSuccess: any;
      PaymentFailure: any;
      ScanTicket: any;
      About: undefined;
      ChangePassword: undefined;
      Notifications: undefined;
      Search: { category?: string } | undefined;
    }
  }
}
