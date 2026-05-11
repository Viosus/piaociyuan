import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * 禁言 / 取消禁言群成员
 *
 * PATCH /api/messages/groups/[id]/members/[memberId]/mute
 * body: { isMuted: boolean }
 *
 * 权限：owner / admin。
 *  - admin 不能 mute owner 或其他 admin（避免内斗）
 *  - 仅 owner 可 mute admin
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
    const isMuted = !!body.isMuted;

    // 自己不能禁言自己（防误操作）
    if (memberId === user.id) {
      return NextResponse.json({ ok: false, error: '不能对自己使用禁言' }, { status: 400 });
    }

    const me = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!me || (me.role !== 'owner' && me.role !== 'admin')) {
      return NextResponse.json({ ok: false, error: '您没有权限执行此操作' }, { status: 403 });
    }

    const target = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: memberId } },
      include: { user: { select: { nickname: true } } },
    });
    if (!target) {
      return NextResponse.json({ ok: false, error: '目标用户不在群中' }, { status: 404 });
    }
    if (target.role === 'owner') {
      return NextResponse.json({ ok: false, error: '不能禁言群主' }, { status: 403 });
    }
    // admin 不能禁言其他 admin（只有 owner 才能）
    if (me.role === 'admin' && target.role === 'admin') {
      return NextResponse.json(
        { ok: false, error: '管理员不能禁言其他管理员，仅群主可以' },
        { status: 403 }
      );
    }
    if (target.isMuted === isMuted) {
      return NextResponse.json(
        { ok: false, error: isMuted ? '该成员已被禁言' : '该成员未被禁言' },
        { status: 400 }
      );
    }

    const targetNickname = target.user.nickname || '用户';
    const actionText = isMuted ? '禁言了' : '解除了禁言';

    await prisma.$transaction([
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: memberId } },
        data: { isMuted },
      }),
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${user.nickname || '管理员'} ${actionText} ${targetNickname}`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({ ok: true, isMuted });
  } catch (error) {
    console.error('[GROUP_MUTE_PATCH]', error);
    return NextResponse.json({ ok: false, error: '操作失败' }, { status: 500 });
  }
}
