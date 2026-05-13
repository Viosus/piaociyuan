import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { loginWithWechat } from '../../services/auth';
import { toast } from '../../components/Toast';
import './index.scss';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    toast.loading('登录中');
    const res = await loginWithWechat();
    toast.hideLoading();
    setLoading(false);
    if (res.ok) {
      toast.success('登录成功');
      // 跳到主页 tab（不能 navigateTo 到 tabBar 页）
      Taro.switchTab({ url: '/pages/home/index' });
    } else {
      toast.error(res.error || '登录失败');
    }
  };

  return (
    <View className="login-page">
      <View className="login-hero">
        <Text className="login-logo">🎫</Text>
        <Text className="login-title">票次元</Text>
        <Text className="login-subtitle">追星不止于此</Text>
      </View>

      <View className="login-actions">
        <Button
          className="login-btn"
          openType="getUserInfo"
          loading={loading}
          disabled={loading}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
        <Text className="login-hint">
          登录即表示同意 用户协议 与 隐私政策
        </Text>
      </View>
    </View>
  );
}
