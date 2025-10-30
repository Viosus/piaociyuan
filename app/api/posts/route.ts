// app/api/posts/route.ts
/**
 * 帖子列表 API
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const eventId = searchParams.get('eventId'); // 可选：按活动筛选

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {
      isVisible: true, // 只显示可见的帖子
    };

    if (eventId) {
      where.eventId = parseInt(eventId);
    }

    // 查询帖子列表
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              city: true,
              date: true,
            },
          },
          images: {
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    // 格式化返回数据
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      location: post.location || null,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        nickname: post.user.nickname || '匿名用户',
        avatar: post.user.avatar || null,
      },
      event: post.event
        ? {
            id: post.event.id,
            name: post.event.name,
            city: post.event.city,
            date: post.event.date,
          }
        : null,
      images: post.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        width: img.width || null,
        height: img.height || null,
      })),
    }));

    return NextResponse.json({
      ok: true,
      data: formattedPosts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('[POSTS_LIST_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取帖子列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { content, eventId, location, images } = body;

    // 3️⃣ 验证必填字段
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '帖子内容不能为空',
        },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '帖子内容不能超过5000字',
        },
        { status: 400 }
      );
    }

    // 验证图片数量
    if (images && images.length > 9) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '最多只能上传9张图片',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 如果提供了 eventId，验证活动是否存在
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
      });

      if (!event) {
        return NextResponse.json(
          {
            ok: false,
            code: 'NOT_FOUND',
            message: '活动不存在',
          },
          { status: 404 }
        );
      }
    }

    // 5️⃣ 创建帖子（使用事务确保原子性）
    const post = await prisma.post.create({
      data: {
        userId,
        content: content.trim(),
        eventId: eventId ? parseInt(eventId) : null,
        location: location || null,
        images: images
          ? {
              create: images.map((img: any, index: number) => ({
                imageUrl: img.imageUrl,
                width: img.width || null,
                height: img.height || null,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            city: true,
            date: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    console.log('[POST_CREATE_SUCCESS]', {
      postId: post.id,
      userId,
      imageCount: images?.length || 0,
    });

    // 6️⃣ 格式化返回数据
    const formattedPost = {
      id: post.id,
      content: post.content,
      location: post.location || null,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id,
        nickname: post.user.nickname || '匿名用户',
        avatar: post.user.avatar || null,
      },
      event: post.event
        ? {
            id: post.event.id,
            name: post.event.name,
            city: post.event.city,
            date: post.event.date,
          }
        : null,
      images: post.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        width: img.width || null,
        height: img.height || null,
      })),
    };

    return NextResponse.json(
      {
        ok: true,
        data: formattedPost,
        message: '发布成功',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST_CREATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '发布失败',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
