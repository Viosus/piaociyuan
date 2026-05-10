// app/api/search/route.ts
/**
 * 综合搜索 API
 *
 * 同时查询用户 / 帖子 / 活动，type=all 返回三类，type=user/post/event 仅返回单类。
 * 不强制登录（事件 / 帖子任何人可搜），但搜用户排除自己（如果 token 可识别）。
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || 'all') as 'all' | 'user' | 'post' | 'event';
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * PAGE_SIZE;

    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: { users: [], posts: [], events: [] } });
    }

    // 拿当前用户 id（仅用于排除自己）
    let currentUserId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) currentUserId = payload.id;
    }

    const tasks: Promise<unknown>[] = [];
    const results: { users: unknown[]; posts: unknown[]; events: unknown[] } = {
      users: [],
      posts: [],
      events: [],
    };

    // Users
    if (type === 'all' || type === 'user') {
      tasks.push(
        prisma.user.findMany({
          where: {
            AND: [
              currentUserId ? { id: { not: currentUserId } } : {},
              { isBanned: false },
              {
                OR: [
                  { nickname: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q } },
                  { bio: { contains: q, mode: 'insensitive' } },
                ],
              },
            ],
          },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            isVerified: true,
            verifiedType: true,
            followerCount: true,
          },
          take: type === 'user' ? PAGE_SIZE : 6,
          skip: type === 'user' ? skip : 0,
        }).then((r) => {
          results.users = r;
        })
      );
    }

    // Posts
    if (type === 'all' || type === 'post') {
      tasks.push(
        prisma.post.findMany({
          where: {
            isVisible: true,
            content: { contains: q, mode: 'insensitive' },
          },
          select: {
            id: true,
            content: true,
            likeCount: true,
            commentCount: true,
            createdAt: true,
            user: {
              select: { id: true, nickname: true, avatar: true },
            },
            images: {
              select: { imageUrl: true },
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: type === 'post' ? PAGE_SIZE : 6,
          skip: type === 'post' ? skip : 0,
        }).then((r) => {
          results.posts = r;
        })
      );
    }

    // Events
    if (type === 'all' || type === 'event') {
      tasks.push(
        prisma.event.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { venue: { contains: q } },
              { artist: { contains: q } },
            ],
          },
          select: {
            id: true,
            name: true,
            city: true,
            venue: true,
            date: true,
            time: true,
            cover: true,
            category: true,
            saleStatus: true,
          },
          orderBy: { date: 'desc' },
          take: type === 'event' ? PAGE_SIZE : 6,
          skip: type === 'event' ? skip : 0,
        }).then((r) => {
          results.events = r;
        })
      );
    }

    await Promise.all(tasks);

    return NextResponse.json({ ok: true, data: results });
  } catch (error) {
    console.error('[SEARCH_ERROR]', error);
    return NextResponse.json({ ok: false, message: '搜索失败' }, { status: 500 });
  }
}
