import React, { Suspense, ComponentType } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../constants/config';
import GradientHeader from '../components/GradientHeader';

// Auth Screens (eager - needed immediately)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Core tab screens (eager - shown on main tabs)
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import EncoreScreen from '../screens/EncoreScreen';
import TicketsScreen from '../screens/TicketsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Lazy wrapper for non-core screens
function lazy(factory: () => Promise<{ default: ComponentType<any> }>) {
  const LazyComponent = React.lazy(factory);
  return function LazyScreen(props: any) {
    return (
      <Suspense fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      }>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Non-core screens (lazy - loaded on demand)
const EventDetailScreen = lazy(() => import('../screens/EventDetailScreen'));
const CheckoutScreen = lazy(() => import('../screens/CheckoutScreen'));
const PaymentScreen = lazy(() => import('../screens/PaymentScreen'));
const TicketDetailScreen = lazy(() => import('../screens/TicketDetailScreen'));
const OrdersScreen = lazy(() => import('../screens/OrdersScreen'));
const OrderDetailScreen = lazy(() => import('../screens/OrderDetailScreen'));
const FavoritesScreen = lazy(() => import('../screens/FavoritesScreen'));
const EditProfileScreen = lazy(() => import('../screens/EditProfileScreen'));
const VerificationScreen = lazy(() => import('../screens/VerificationScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));
const FollowingListScreen = lazy(() => import('../screens/FollowingListScreen'));
const FollowerListScreen = lazy(() => import('../screens/FollowerListScreen'));
const TransferTicketScreen = lazy(() => import('../screens/TransferTicketScreen'));
const ReceiveTransferScreen = lazy(() => import('../screens/ReceiveTransferScreen'));
const CreatePostScreen = lazy(() => import('../screens/CreatePostScreen'));
const PostDetailScreen = lazy(() => import('../screens/PostDetailScreen'));
const UserProfileScreen = lazy(() => import('../screens/UserProfileScreen'));
const ConversationsScreen = lazy(() => import('../screens/ConversationsScreen'));
const ChatScreen = lazy(() => import('../screens/ChatScreen'));
const SelectUserScreen = lazy(() => import('../screens/SelectUserScreen'));
const CreateGroupScreen = lazy(() => import('../screens/CreateGroupScreen'));
const GroupDetailScreen = lazy(() => import('../screens/GroupDetailScreen'));
const IdDocumentsScreen = lazy(() => import('../screens/IdDocumentsScreen'));
const AddIdDocumentScreen = lazy(() => import('../screens/AddIdDocumentScreen'));
const AddressesScreen = lazy(() => import('../screens/AddressesScreen'));
const AddAddressScreen = lazy(() => import('../screens/AddAddressScreen'));
const MyCollectiblesScreen = lazy(() => import('../screens/MyCollectiblesScreen'));
const CollectibleDetailScreen = lazy(() => import('../screens/CollectibleDetailScreen'));
const TierSelectionScreen = lazy(() => import('../screens/TierSelectionScreen'));
const PaymentSuccessScreen = lazy(() => import('../screens/PaymentSuccessScreen'));
const PaymentFailureScreen = lazy(() => import('../screens/PaymentFailureScreen'));
const ScanTicketScreen = lazy(() => import('../screens/ScanTicketScreen'));
const AboutScreen = lazy(() => import('../screens/AboutScreen'));
const ChangePasswordScreen = lazy(() => import('../screens/ChangePasswordScreen'));
const NotificationsScreen = lazy(() => import('../screens/NotificationsScreen'));
const SearchScreen = lazy(() => import('../screens/SearchScreen'));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

// Tab 导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={GRADIENTS.header as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        ),
        headerBackground: () => <GradientHeader />,
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#ffffff',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <Image source={require('../../assets/icons/search.png')} style={{ width: size, height: size, tintColor: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: '宇宙信号',
          tabBarIcon: ({ size, focused }) => (
            <Image source={require('../../assets/icons/signals.png')} style={{ width: size, height: size, tintColor: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Encore"
        component={EncoreScreen}
        options={{
          title: '安可区',
          tabBarIcon: ({ size, focused }) => (
            <Image source={require('../../assets/icons/encore.png')} style={{ width: size, height: size, tintColor: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          title: '票夹',
          tabBarIcon: ({ size, focused }) => (
            <Image source={require('../../assets/icons/orders.png')} style={{ width: size, height: size, tintColor: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ size, focused }) => (
            <Image source={require('../../assets/icons/profile.png')} style={{ width: size, height: size, tintColor: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' }} resizeMode="contain" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 主应用 Stack 导航（包含 Tab 和详情页）
function MainStackNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerBackground: () => <GradientHeader />,
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: '活动详情' }} />
      <MainStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: '确认订单' }} />
      <MainStack.Screen name="Payment" component={PaymentScreen} options={{ title: '支付订单' }} />
      <MainStack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: '门票详情' }} />
      <MainStack.Screen name="Orders" component={OrdersScreen} options={{ title: '我的订单' }} />
      <MainStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: '订单详情' }} />
      <MainStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: '我的收藏' }} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '编辑资料' }} />
      <MainStack.Screen name="Verification" component={VerificationScreen} options={{ title: '身份认证' }} />
      <MainStack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
      <MainStack.Screen name="FollowingList" component={FollowingListScreen} options={{ title: '关注列表' }} />
      <MainStack.Screen name="FollowerList" component={FollowerListScreen} options={{ title: '粉丝列表' }} />
      <MainStack.Screen name="TransferTicket" component={TransferTicketScreen} options={{ title: '转让门票' }} />
      <MainStack.Screen name="ReceiveTransfer" component={ReceiveTransferScreen} options={{ title: '接收转让' }} />
      <MainStack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: '发帖', headerShown: false }} />
      <MainStack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '帖子详情', headerShown: false }} />
      <MainStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: '用户主页' }} />
      <MainStack.Screen name="Conversations" component={ConversationsScreen} options={{ title: '消息', headerShown: false }} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={{ title: '聊天', headerShown: false }} />
      <MainStack.Screen name="SelectUser" component={SelectUserScreen} options={{ title: '选择用户' }} />
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: '创建群聊' }} />
      <MainStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '群聊详情', headerShown: false }} />
      <MainStack.Screen name="IdDocuments" component={IdDocumentsScreen} options={{ title: '证件管理' }} />
      <MainStack.Screen name="AddIdDocument" component={AddIdDocumentScreen} options={{ title: '添加证件' }} />
      <MainStack.Screen name="Addresses" component={AddressesScreen} options={{ title: '地址管理' }} />
      <MainStack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: '添加地址' }} />
      <MainStack.Screen name="MyCollectibles" component={MyCollectiblesScreen} options={{ title: '我的收藏品' }} />
      <MainStack.Screen name="CollectibleDetail" component={CollectibleDetailScreen} options={{ title: '收藏品详情' }} />
      <MainStack.Screen name="TierSelection" component={TierSelectionScreen} options={{ title: '选择票档' }} />
      <MainStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ title: '支付成功' }} />
      <MainStack.Screen name="PaymentFailure" component={PaymentFailureScreen} options={{ title: '支付失败' }} />
      <MainStack.Screen name="ScanTicket" component={ScanTicketScreen} options={{ title: '扫码验票' }} />
      <MainStack.Screen name="About" component={AboutScreen} options={{ title: '关于' }} />
      <MainStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: '修改密码' }} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: '通知' }} />
      <MainStack.Screen name="Search" component={SearchScreen} options={{ title: '搜索', headerShown: false }} />
    </MainStack.Navigator>
  );
}

// 认证流程导航 (Stack Navigator)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// 主导航器
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStackNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
