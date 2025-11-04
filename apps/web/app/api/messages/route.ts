import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitToUser } from '@/lib/socket';

// 发送消息
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { conversationId, content, receiverId } = await request.json();

    if (!conversationId || !content || !receiverId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
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

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId,
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

    // 增加接收方的未读计数
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: receiverId,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // 🔥 实时推送：通过 WebSocket 推送新消息给接收方
    try {
      emitToUser(receiverId, 'message:new', {
        ...message,
        conversationId,
      });
      console.log(`[实时推送] 消息已推送给用户 ${receiverId}`);
    } catch (error) {
      console.error('[实时推送] 推送失败:', error);
      // 推送失败不影响消息发送
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 });
  }
}
