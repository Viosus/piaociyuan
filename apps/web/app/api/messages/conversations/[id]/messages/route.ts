import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitToUser } from '@/lib/socket';

// 获取对话消息列表
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // 获取消息列表
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return NextResponse.json({ error: '获取消息列表失败' }, { status: 500 });
  }
}

// 发送消息到对话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    // 检查用户是否是该对话的参与者
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: '无权发送消息' }, { status: 403 });
    }

    // 获取对话信息和其他参与者
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: { not: user.id } },
          select: { userId: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    const isGroup = conversation.type === 'group';

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId: isGroup ? null : conversation.participants[0]?.userId,
        content,
        messageType: 'text',
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // 更新对话的最后消息时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // 增加其他成员的未读计数
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: user.id },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // 实时推送：通过 WebSocket 推送新消息给所有其他参与者
    try {
      const otherUserIds = conversation.participants.map((p: { userId: string }) => p.userId);
      for (const userId of otherUserIds) {
        emitToUser(userId, 'message:new', {
          ...message,
          conversationId,
        });
      }
      console.log(`[实时推送] 消息已推送给 ${otherUserIds.length} 个用户`);
    } catch (error) {
      console.error('[实时推送] 推送失败:', error);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 });
  }
}
