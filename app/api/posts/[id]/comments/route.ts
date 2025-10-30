// app/api/posts/[id]/comments/route.ts
/**
 * 帖子评论 API
 *
 * GET /api/posts/[id]/comments - 获取评论列表
 * POST /api/posts/[id]/comments - 发表评论
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> };

// 获取评论列表
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const parentId = searchParams.get('parentId'); // 可选：获取某条评论的回复

    const skip = (page - 1) * pageSize;

    // 1️⃣ 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, isVisible: true },
    });

    if (!post || !post.isVisible) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '帖子不存在',
        },
        { status: 404 }
      );
    }

    // 2️⃣ 构建查询条件
    const where: any = {
      postId,
    };

    // 如果指定了 parentId，只获取该评论的回复；否则获取顶层评论
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    // 3️⃣ 查询评论列表
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.comment.count({ where }),
    ]);

    // 4️⃣ 格式化返回数据
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment._count.replies,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        nickname: comment.user.nickname || '匿名用户',
        avatar: comment.user.avatar || null,
      },
      parentComment: comment.parent
        ? {
            id: comment.parent.id,
            user: {
              id: comment.parent.user.id,
              nickname: comment.parent.user.nickname || '匿名用户',
            },
          }
        : null,
    }));

    return NextResponse.json({
      ok: true,
      data: formattedComments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('[COMMENTS_LIST_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取评论列表失败',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 发表评论
export async function POST(req: NextRequest, { params }: Props) {
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
    const { id: postId } = await params;

    // 2️⃣ 解析请求体
    const body = await req.json();
    const { content, parentId } = body;

    // 3️⃣ 验证必填字段
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '评论内容不能为空',
        },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '评论内容不能超过1000字',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, isVisible: true },
    });

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NOT_FOUND',
          message: '帖子不存在',
        },
        { status: 404 }
      );
    }

    if (!post.isVisible) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: '该帖子已被删除，无法评论',
        },
        { status: 403 }
      );
    }

    // 5️⃣ 如果是回复，检查父评论是否存在
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            ok: false,
            code: 'NOT_FOUND',
            message: '父评论不存在',
          },
          { status: 404 }
        );
      }

      if (parentComment.postId !== postId) {
        return NextResponse.json(
          {
            ok: false,
            code: 'INVALID_INPUT',
            message: '父评论不属于该帖子',
          },
          { status: 400 }
        );
      }
    }

    // 6️⃣ 创建评论并更新帖子评论数（使用事务）
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          userId,
          content: content.trim(),
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      }),
    ]);

    console.log('[COMMENT_CREATE_SUCCESS]', {
      commentId: comment.id,
      postId,
      userId,
      isReply: !!parentId,
    });

    // 7️⃣ 格式化返回数据
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        nickname: comment.user.nickname || '匿名用户',
        avatar: comment.user.avatar || null,
      },
      parentComment: comment.parent
        ? {
            id: comment.parent.id,
            user: {
              id: comment.parent.user.id,
              nickname: comment.parent.user.nickname || '匿名用户',
            },
          }
        : null,
    };

    return NextResponse.json(
      {
        ok: true,
        data: formattedComment,
        message: '评论成功',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[COMMENT_CREATE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '评论失败',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
