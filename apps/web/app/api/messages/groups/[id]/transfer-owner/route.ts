import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * 转让群主
 *
 * PATCH /api/messages/groups/[id]/transfer-owner
 * body: { toUserId: string }
 *
 * 权限：仅当前 owner。
 *  - 目标必须在群内
 *  - 原 owner 降为 admin
 *  - Conversation.creatorId 同步改成新 owner 的 id（业务上 creatorId 标识真正控制者）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: '未授权' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { toUserId } = await request.json();

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json({ ok: false, error: '请提供目标用户 ID' }, { status: 400 });
    }
    if (toUserId === user.id) {
      return NextResponse.json({ ok: false, error: '不能转让给自己' }, { status: 400 });
    }

    // 当前用户必须是 owner
    const me = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!me || me.role !== 'owner') {
      return NextResponse.json({ ok: false, error: '仅群主可以转让群主身份' }, { status: 403 });
    }

    // 目标必须在群内
    const target = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: toUserId } },
      include: { user: { select: { id: true, nickname: true } } },
    });
    if (!target) {
      return NextResponse.json({ ok: false, error: '目标用户不在群中' }, { status: 404 });
    }

    const targetNickname = target.user.nickname || '用户';

    // 事务：原 owner → admin；目标 → owner；conversation.creatorId 同步
    await prisma.$transaction([
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { role: 'admin' },
      }),
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: toUserId } },
        data: { role: 'owner', isMuted: false }, // 群主不能被禁言，顺手清掉历史 isMuted
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { creatorId: toUserId },
      }),
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${user.nickname || '原群主'} 将群主转让给了 ${targetNickname}`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GROUP_TRANSFER_OWNER]', error);
    return NextResponse.json({ ok: false, error: '转让群主失败' }, { status: 500 });
  }
}
