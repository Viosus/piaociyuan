import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 退出群聊
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

    // 检查用户是否是群成员
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: '您不是该群成员' }, { status: 403 });
    }

    // 群主不能直接退出，需要先转让群主或解散群
    if (participant.role === 'owner') {
      // 查找群成员数量
      const memberCount = await prisma.conversationParticipant.count({
        where: { conversationId: id },
      });

      if (memberCount > 1) {
        return NextResponse.json({
          error: '群主不能直接退出群聊，请先转让群主或解散群聊'
        }, { status: 400 });
      }

      // 如果只剩群主一个人，直接解散群
      await prisma.conversation.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: '群聊已解散（您是最后一位成员）'
      });
    }

    // 普通成员或管理员退出
    await prisma.$transaction([
      prisma.conversationParticipant.delete({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: user.id,
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
          content: `${user.nickname || '用户'} 退出了群聊`,
          messageType: 'system',
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: '已退出群聊' });
  } catch (error) {
    console.error('退出群聊失败:', error);
    return NextResponse.json({ error: '退出群聊失败' }, { status: 500 });
  }
}
