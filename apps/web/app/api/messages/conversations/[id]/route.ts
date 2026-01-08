import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取某个对话的所有消息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // 检查用户是否是该对话的参与者
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: '无权访问该对话' }, { status: 403 });
    }

    // 获取对话信息
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                isVerified: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    const isGroup = conversation.type === 'group';

    // 标记消息为已读
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // 重置未读计数
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    // 获取对方用户（私聊）
    const otherParticipant = conversation.participants.find(
      (p: typeof conversation.participants[number]) => p.userId !== user.id
    );

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type || 'private',
      // 私聊信息
      otherUser: !isGroup ? otherParticipant?.user : null,
      // 群聊信息
      name: isGroup ? conversation.name : null,
      avatar: isGroup ? conversation.avatar : null,
      memberCount: isGroup ? conversation.memberCount : null,
      myRole: participant.role,
      // 消息
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('获取对话消息失败:', error);
    return NextResponse.json({ error: '获取对话消息失败' }, { status: 500 });
  }
}
