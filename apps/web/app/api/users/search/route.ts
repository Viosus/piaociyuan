import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 搜索用户
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // 搜索用户（排除自己）
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          {
            OR: [
              { nickname: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        phone: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('搜索用户失败:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
