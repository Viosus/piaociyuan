import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * 提升 / 撤销群管理员
 *
 * PATCH /api/messages/groups/[id]/members/[memberId]/role
 * body: { role: 'admin' | 'member' }
 *
 * 权限：仅 owner 可调。
 *  - 目标必须在群内
 *  - 不能改 owner 的 role（只能用 transfer-owner 转让）
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
    const { role } = await request.json();

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json(
        { ok: false, error: "role 必须是 'admin' 或 'member'" },
        { status: 400 }
      );
    }

    // 当前用户权限检查：仅 owner
    const me = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: '您不是该群成员' }, { status: 403 });
    }
    if (me.role !== 'owner') {
      return NextResponse.json(
        { ok: false, error: '仅群主可以调整管理员' },
        { status: 403 }
      );
    }

    // 目标必须在群内
    const target = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: memberId } },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });
    if (!target) {
      return NextResponse.json({ ok: false, error: '目标用户不在群中' }, { status: 404 });
    }
    if (target.role === 'owner') {
      return NextResponse.json(
        { ok: false, error: '群主的角色不能直接调整，请使用"转让群主"' },
        { status: 400 }
      );
    }
    if (target.role === role) {
      return NextResponse.json(
        { ok: false, error: `该成员已经是 ${role === 'admin' ? '管理员' : '普通成员'}` },
        { status: 400 }
      );
    }

    const targetNickname = target.user.nickname || '用户';
    const actionText = role === 'admin' ? '设为了管理员' : '撤销了管理员身份';

    await prisma.$transaction([
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: memberId } },
        data: { role },
      }),
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${user.nickname || '群主'} 将 ${targetNickname} ${actionText}`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    console.error('[GROUP_ROLE_PATCH]', error);
    return NextResponse.json({ ok: false, error: '调整角色失败' }, { status: 500 });
  }
}
