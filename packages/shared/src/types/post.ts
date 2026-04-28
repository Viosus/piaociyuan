// Post / Comment 相关类型
// 对应 Prisma schema:347（Post）和 :425（Comment）

export interface Post {
  id: string;                  // UUID
  userId: string;
  content: string;
  eventId: number | null;      // ref Event.id (Int)
  location: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;

  // 可能附带
  user?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
    isVerified?: boolean;
  };
  images?: PostImage[];
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface PostImage {
  id: string;
  postId: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  order: number;
  createdAt: string;
}

export interface Comment {
  id: string;                  // UUID
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt: string;

  // 可能附带
  user?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
  isLiked?: boolean;
  replies?: Comment[];
}
