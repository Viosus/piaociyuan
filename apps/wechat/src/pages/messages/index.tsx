import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { isLoggedIn } from '../../services/auth';
import Empty from '../../components/Empty';
import './index.scss';

export default function MessagesPage() {
  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' });
    }
  });

  return (
    <View className="messages-page">
      <Empty
        icon="💬"
        title="消息功能 Phase 3 上线"
        desc="私聊和群聊将在下一个迭代周期发布"
      />
      <Text className="hint">在此期间，可使用网页版或 App 端进行私信沟通</Text>
    </View>
  );
}
