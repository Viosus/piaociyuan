import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取当前用户的所有对话列表
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 查询用户参与的所有对话
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: { not: user.id }, // 获取对话的另一方
              },
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true,
                    phone: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1, // 最新一条消息
              select: {
                content: true,
                createdAt: true,
                senderId: true,
                isRead: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc',
        },
      },
    });

    // 格式化返回数据
    const conversations = participants.map((p) => ({
      id: p.conversation.id,
      otherUser: p.conversation.participants[0]?.user,
      lastMessage: p.conversation.messages[0],
      unreadCount: p.unreadCount,
      lastMessageAt: p.conversation.lastMessageAt,
    }));

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    return NextResponse.json({ error: '获取对话列表失败' }, { status: 500 });
  }
}

// 创建新对话或获取已存在的对话
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { otherUserId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json({ error: '缺少对方用户ID' }, { status: 400 });
    }

    if (otherUserId === user.id) {
      return NextResponse.json({ error: '不能和自己对话' }, { status: 400 });
    }

    // 检查对方用户是否存在
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, nickname: true, avatar: true },
    });

    if (!otherUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 查找是否已存在对话（两个用户之间的对话）
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [user.id, otherUserId] },
          },
        },
      },
      include: {
        participants: {
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
      },
    });

    if (existingConversation) {
      // 返回已存在的对话
      const otherParticipant = existingConversation.participants.find(
        (p) => p.userId !== user.id
      );
      return NextResponse.json({
        id: existingConversation.id,
        otherUser: otherParticipant?.user,
        isNew: false,
      });
    }

    // 创建新对话
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: {
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
      },
    });

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== user.id
    );

    return NextResponse.json({
      id: conversation.id,
      otherUser: otherParticipant?.user,
      isNew: true,
    });
  } catch (error) {
    console.error('创建对话失败:', error);
    return NextResponse.json({ error: '创建对话失败' }, { status: 500 });
  }
}
