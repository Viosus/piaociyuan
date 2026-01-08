import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 添加群成员
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { memberIds } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: '请选择要添加的成员' }, { status: 400 });
    }

    // 检查用户权限
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.id,
        },
      },
    });

    if (!participant || (participant.role !== 'owner' && participant.role !== 'admin')) {
      return NextResponse.json({ error: '您没有权限添加成员' }, { status: 403 });
    }

    // 获取群聊信息
    const conversation = await prisma.conversation.findUnique({
      where: { id, type: 'group' },
    });

    if (!conversation) {
      return NextResponse.json({ error: '群聊不存在' }, { status: 404 });
    }

    // 检查是否超过人数限制
    if (conversation.memberCount + memberIds.length > conversation.maxMembers) {
      return NextResponse.json({ error: `群成员已达上限（${conversation.maxMembers}人）` }, { status: 400 });
    }

    // 过滤已经是成员的用户
    const existingMembers = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: id,
        userId: { in: memberIds },
      },
      select: { userId: true },
    });

    const existingMemberIds = existingMembers.map(m => m.userId);
    const newMemberIds = memberIds.filter((mid: string) => !existingMemberIds.includes(mid));

    if (newMemberIds.length === 0) {
      return NextResponse.json({ error: '所选用户已经是群成员' }, { status: 400 });
    }

    // 验证新成员用户存在
    const newMembers = await prisma.user.findMany({
      where: { id: { in: newMemberIds } },
      select: { id: true, nickname: true },
    });

    if (newMembers.length !== newMemberIds.length) {
      return NextResponse.json({ error: '部分用户不存在' }, { status: 400 });
    }

    // 批量添加成员
    await prisma.$transaction([
      prisma.conversationParticipant.createMany({
        data: newMemberIds.map((memberId: string) => ({
          conversationId: id,
          userId: memberId,
          role: 'member',
        })),
      }),
      prisma.conversation.update({
        where: { id },
        data: { memberCount: { increment: newMemberIds.length } },
      }),
      // 创建系统消息
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          content: `${user.nickname || '用户'} 邀请了 ${newMembers.map(m => m.nickname || '用户').join('、')} 加入群聊`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      addedCount: newMemberIds.length,
      members: newMembers,
    });
  } catch (error) {
    console.error('添加群成员失败:', error);
    return NextResponse.json({ error: '添加群成员失败' }, { status: 500 });
  }
}

// 移除群成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: '缺少成员ID' }, { status: 400 });
    }

    // 检查用户权限
    const myParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.id,
        },
      },
    });

    if (!myParticipant || (myParticipant.role !== 'owner' && myParticipant.role !== 'admin')) {
      return NextResponse.json({ error: '您没有权限移除成员' }, { status: 403 });
    }

    // 检查被移除的成员
    const targetParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: memberId,
        },
      },
      include: {
        user: { select: { nickname: true } },
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: '该用户不是群成员' }, { status: 404 });
    }

    // 群主不能被移除
    if (targetParticipant.role === 'owner') {
      return NextResponse.json({ error: '不能移除群主' }, { status: 403 });
    }

    // 管理员只能被群主移除
    if (targetParticipant.role === 'admin' && myParticipant.role !== 'owner') {
      return NextResponse.json({ error: '只有群主可以移除管理员' }, { status: 403 });
    }

    // 移除成员
    await prisma.$transaction([
      prisma.conversationParticipant.delete({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: memberId,
          },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: { memberCount: { decrement: 1 } },
      }),
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          content: `${targetParticipant.user.nickname || '用户'} 被移出了群聊`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: '成员已移除' });
  } catch (error) {
    console.error('移除群成员失败:', error);
    return NextResponse.json({ error: '移除群成员失败' }, { status: 500 });
  }
}
