import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * 设置群内昵称
 *
 * PATCH /api/messages/groups/[id]/members/[memberId]/nickname
 * body: { nickname: string | null }   // null / 空字符串 = 清除群昵称
 *
 * 权限：
 *  - 自己改自己（任何角色都可）
 *  - owner / admin 可改任何人（含彼此）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: '未授权' }, { status: 401 });
    }

    const { id: conversationId, memberId } = await params;
    const body = await request.json();
    const rawNickname: string | null = body.nickname ?? null;

    // 长度校验（最长 20 字符）
    if (rawNickname !== null && typeof rawNickname !== 'string') {
      return NextResponse.json({ ok: false, error: 'nickname 必须是字符串或 null' }, { status: 400 });
    }
    const nickname = rawNickname ? rawNickname.trim().slice(0, 20) : null;
    const cleaned = nickname || null; // 空字符串视为 null

    const me = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: '您不是该群成员' }, { status: 403 });
    }

    const isSelf = memberId === user.id;
    const isAdmin = me.role === 'owner' || me.role === 'admin';
    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: '只能修改自己的群昵称（管理员可改任意成员）' },
        { status: 403 }
      );
    }

    const target = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: memberId } },
    });
    if (!target) {
      return NextResponse.json({ ok: false, error: '目标用户不在群中' }, { status: 404 });
    }

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: memberId } },
      data: { nickname: cleaned },
    });

    return NextResponse.json({ ok: true, nickname: cleaned });
  } catch (error) {
    console.error('[GROUP_NICKNAME_PATCH]', error);
    return NextResponse.json({ ok: false, error: '修改群昵称失败' }, { status: 500 });
  }
}
