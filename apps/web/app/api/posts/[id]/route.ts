import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            isVerified: true,
            verifiedType: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            city: true,
            venue: true,
            date: true,
            time: true,
            cover: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        comments: {
          where: {
            parentId: null,
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
        { status: 404 }
      );
    }

    // 增加浏览量（每个用户只能增加一次）
    let viewCountIncrement = 0;
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // 尝试获取用户ID
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    // 检查用户是否已浏览过此帖子
    if (userId) {
      const existingView = await prisma.postView.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      // 如果用户未浏览过，创建浏览记录并增加浏览量
      if (!existingView) {
        await prisma.$transaction([
          prisma.postView.create({
            data: {
              postId,
              userId,
            },
          }),
          prisma.post.update({
            where: { id: postId },
            data: {
              viewCount: {
                increment: 1,
              },
            },
          }),
        ]);
        viewCountIncrement = 1;
      }
    } else {
      // 未登录用户，基于IP地址（简化处理，直接增加）
      // 在生产环境中应该使用IP地址或其他标识符
      await prisma.post.update({
        where: { id: postId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
      viewCountIncrement = 1;
    }

    const formattedPost = {
      id: post.id,
      content: post.content,
      location: post.location || null,
      viewCount: post.viewCount + viewCountIncrement,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: post.user.id,
        nickname: post.user.nickname || 'Anonymous',
        avatar: post.user.avatar || null,
        bio: post.user.bio || null,
        isVerified: post.user.isVerified,
        verifiedType: post.user.verifiedType,
      },
      event: post.event
        ? {
            id: post.event.id,
            name: post.event.name,
            city: post.event.city,
            venue: post.event.venue,
            date: post.event.date,
            time: post.event.time,
            cover: post.event.cover,
          }
        : null,
      images: post.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        width: img.width || null,
        height: img.height || null,
      })),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        likeCount: comment.likeCount,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          nickname: comment.user.nickname || 'Anonymous',
          avatar: comment.user.avatar || null,
        },
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          likeCount: reply.likeCount,
          createdAt: reply.createdAt.toISOString(),
          user: {
            id: reply.user.id,
            nickname: reply.user.nickname || 'Anonymous',
            avatar: reply.user.avatar || null,
          },
        })),
      })),
    };

    return NextResponse.json({
      ok: true,
      data: formattedPost,
    });
  } catch (error: unknown) {
    console.error('[POST_DETAIL_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: 'Failed to load post',
      },
      { status: 500 }
    );
  }
}
