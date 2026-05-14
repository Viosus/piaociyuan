import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Avatar from './Avatar';
import { toast } from './Toast';
import './CommentItem.scss';

interface CommentUser {
  id: string;
  nickname: string;
  avatar: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  likeCount?: number;
  createdAt: string;
  user: CommentUser;
}

interface CommentData {
  id: string;
  content: string;
  likeCount?: number;
  replyCount?: number;
  createdAt: string;
  user: CommentUser;
  replies?: CommentReply[];
}

interface CommentItemProps {
  comment: CommentData;
  onReply?: (commentId: string, userNickname: string) => void;
}

export default function CommentItem({ comment, onReply }: CommentItemProps) {
  const goUser = (uid: string, e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    Taro.navigateTo({ url: `/pages/user-profile/index?id=${uid}` });
  };

  const handleReply = () => {
    onReply?.(comment.id, comment.user.nickname);
  };

  const handleViewMoreReplies = () => {
    // Phase 2b-ii 才做完整嵌套展开
    toast.info('完整回复列表 Phase 2b-ii 上线');
  };

  const replies = comment.replies || [];
  const replyCount = comment.replyCount || 0;
  const hasMoreReplies = replyCount > replies.length;

  return (
    <View className="comment-item">
      <View className="comment-row">
        <View onClick={(e) => goUser(comment.user.id, e)}>
          <Avatar src={comment.user.avatar} name={comment.user.nickname} size={64} />
        </View>
        <View className="comment-body">
          <Text className="comment-user-name" onClick={(e) => goUser(comment.user.id, e)}>
            {comment.user.nickname}
          </Text>
          <Text className="comment-content">{comment.content}</Text>
          <View className="comment-meta">
            <Text className="comment-time">{formatTime(comment.createdAt)}</Text>
            <Text className="comment-action" onClick={handleReply}>
              回复
            </Text>
          </View>

          {/* 嵌套回复 */}
          {replies.length > 0 && (
            <View className="reply-list">
              {replies.map((r) => (
                <View key={r.id} className="reply-row">
                  <Text className="reply-user" onClick={(e) => goUser(r.user.id, e)}>
                    {r.user.nickname}：
                  </Text>
                  <Text className="reply-content">{r.content}</Text>
                </View>
              ))}
              {hasMoreReplies && (
                <Text className="view-more" onClick={handleViewMoreReplies}>
                  查看全部 {replyCount} 条回复 →
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function formatTime(s: string): string {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
