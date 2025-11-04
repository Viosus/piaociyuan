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

    // 获取对话信息和另一方用户信息
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: {
            userId: { not: user.id },
          },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
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

    // 标记消息为已读
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: user.id,
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

    return NextResponse.json({
      id: conversation.id,
      otherUser: conversation.participants[0]?.user,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('获取对话消息失败:', error);
    return NextResponse.json({ error: '获取对话消息失败' }, { status: 500 });
  }
}
