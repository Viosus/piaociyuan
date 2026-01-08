import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 获取群聊详情
export async function GET(
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

    const conversation = await prisma.conversation.findUnique({
      where: { id, type: 'group' },
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
          orderBy: [
            { role: 'asc' }, // owner first, then admin, then member
            { joinedAt: 'asc' },
          ],
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: '群聊不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: conversation.id,
      type: 'group',
      name: conversation.name,
      avatar: conversation.avatar,
      description: conversation.description,
      creatorId: conversation.creatorId,
      memberCount: conversation.memberCount,
      maxMembers: conversation.maxMembers,
      myRole: participant.role,
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        nickname: p.user.nickname,
        avatar: p.user.avatar,
        isVerified: p.user.isVerified,
        role: p.role,
        nickname_in_group: p.nickname,
        isMuted: p.isMuted,
        joinedAt: p.joinedAt,
      })),
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error('获取群聊详情失败:', error);
    return NextResponse.json({ error: '获取群聊详情失败' }, { status: 500 });
  }
}

// 更新群聊信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { name, avatar, description } = await request.json();

    // 检查用户权限（只有群主和管理员可以修改）
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.id,
        },
      },
    });

    if (!participant || (participant.role !== 'owner' && participant.role !== 'admin')) {
      return NextResponse.json({ error: '您没有权限修改群信息' }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (description !== undefined) updateData.description = description;

    const conversation = await prisma.conversation.update({
      where: { id, type: 'group' },
      data: updateData,
    });

    return NextResponse.json({
      id: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      description: conversation.description,
    });
  } catch (error) {
    console.error('更新群聊失败:', error);
    return NextResponse.json({ error: '更新群聊失败' }, { status: 500 });
  }
}

// 解散群聊（仅群主可操作）
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

    // 检查用户是否是群主
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.id,
        },
      },
    });

    if (!participant || participant.role !== 'owner') {
      return NextResponse.json({ error: '只有群主可以解散群聊' }, { status: 403 });
    }

    // 删除群聊（级联删除参与者和消息）
    await prisma.conversation.delete({
      where: { id, type: 'group' },
    });

    return NextResponse.json({ success: true, message: '群聊已解散' });
  } catch (error) {
    console.error('解散群聊失败:', error);
    return NextResponse.json({ error: '解散群聊失败' }, { status: 500 });
  }
}
