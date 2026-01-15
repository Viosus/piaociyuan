import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { COLORS } from '../constants/config';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EncoreScreen from '../screens/EncoreScreen';
import TicketsScreen from '../screens/TicketsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import MyNFTsScreen from '../screens/MyNFTsScreen';
import NFTDetailScreen from '../screens/NFTDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import VerificationScreen from '../screens/VerificationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FollowingListScreen from '../screens/FollowingListScreen';
import FollowerListScreen from '../screens/FollowerListScreen';
import TransferTicketScreen from '../screens/TransferTicketScreen';
import ReceiveTransferScreen from '../screens/ReceiveTransferScreen';
import TransferNFTScreen from '../screens/TransferNFTScreen';
import ReceiveNFTTransferScreen from '../screens/ReceiveNFTTransferScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import SelectUserScreen from '../screens/SelectUserScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import IdDocumentsScreen from '../screens/IdDocumentsScreen';
import AddIdDocumentScreen from '../screens/AddIdDocumentScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

// Tab 导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: COLORS.secondary,
          borderTopColor: 'rgba(234, 243, 83, 0.3)',
        },
        headerStyle: {
          backgroundColor: COLORS.secondary,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: COLORS.primary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '首页',
          headerShown: false,
          tabBarIcon: ({ size }) => (
            <Image source={require('../../assets/icons/search.png')} style={{ width: size, height: size }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: '宇宙信号',
          tabBarIcon: ({ size }) => (
            <Image source={require('../../assets/icons/signals.png')} style={{ width: size, height: size }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Encore"
        component={EncoreScreen}
        options={{
          title: '安可区',
          tabBarIcon: ({ size }) => (
            <Image source={require('../../assets/icons/encore.png')} style={{ width: size, height: size }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          title: '票夹',
          tabBarIcon: ({ size }) => (
            <Image source={require('../../assets/icons/orders.png')} style={{ width: size, height: size }} resizeMode="contain" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ size }) => (
            <Image source={require('../../assets/icons/profile.png')} style={{ width: size, height: size }} resizeMode="contain" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 主应用 Stack 导航（包含 Tab 和详情页）
function MainStackNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: '活动详情',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: '确认订单',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: '支付订单',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{
          title: '门票详情',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: '我的订单',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{
          title: '订单详情',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: '我的收藏',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="MyNFTs"
        component={MyNFTsScreen}
        options={{
          title: '我的次元',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="NFTDetail"
        component={NFTDetailScreen}
        options={{
          title: '次元详情',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: '编辑资料',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          title: '身份认证',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '设置',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="FollowingList"
        component={FollowingListScreen}
        options={{
          title: '关注列表',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="FollowerList"
        component={FollowerListScreen}
        options={{
          title: '粉丝列表',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="TransferTicket"
        component={TransferTicketScreen}
        options={{
          title: '转让门票',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="ReceiveTransfer"
        component={ReceiveTransferScreen}
        options={{
          title: '接收转让',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="TransferNFT"
        component={TransferNFTScreen}
        options={{
          title: '转让次元',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="ReceiveNFTTransfer"
        component={ReceiveNFTTransferScreen}
        options={{
          title: '接收次元',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: '发帖',
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          title: '帖子详情',
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: '用户主页',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          title: '消息',
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: '聊天',
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="SelectUser"
        component={SelectUserScreen}
        options={{
          title: '选择用户',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          title: '创建群聊',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          title: '群聊详情',
          headerShown: false,
        }}
      />
      <MainStack.Screen
        name="IdDocuments"
        component={IdDocumentsScreen}
        options={{
          title: '证件管理',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="AddIdDocument"
        component={AddIdDocumentScreen}
        options={{
          title: '添加证件',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{
          title: '地址管理',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <MainStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{
          title: '添加地址',
          headerStyle: { backgroundColor: COLORS.secondary }, headerTintColor: COLORS.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
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
