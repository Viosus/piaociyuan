import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// 创建群聊
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name, memberIds, avatar, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '群名称不能为空' }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: '请选择至少一个群成员' }, { status: 400 });
    }

    // 确保创建者不在成员列表中（会自动添加为群主）
    const uniqueMemberIds = [...new Set(memberIds.filter((id: string) => id !== user.id))];

    if (uniqueMemberIds.length === 0) {
      return NextResponse.json({ error: '请选择除自己以外的群成员' }, { status: 400 });
    }

    // 验证所有成员用户存在
    const members = await prisma.user.findMany({
      where: { id: { in: uniqueMemberIds } },
      select: { id: true, nickname: true, avatar: true },
    });

    if (members.length !== uniqueMemberIds.length) {
      return NextResponse.json({ error: '部分用户不存在' }, { status: 400 });
    }

    // 创建群聊
    const conversation = await prisma.conversation.create({
      data: {
        type: 'group',
        name: name.trim(),
        avatar: avatar || null,
        description: description || null,
        creatorId: user.id,
        memberCount: uniqueMemberIds.length + 1, // 包括创建者
        participants: {
          create: [
            // 创建者为群主
            { userId: user.id, role: 'owner' },
            // 其他成员
            ...uniqueMemberIds.map((memberId: string) => ({
              userId: memberId,
              role: 'member',
            })),
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
                isVerified: true,
              },
            },
          },
        },
      },
    });

    // 创建系统消息
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: `${user.nickname || '用户'} 创建了群聊`,
        messageType: 'system',
      },
    });

    return NextResponse.json({
      id: conversation.id,
      type: 'group',
      name: conversation.name,
      avatar: conversation.avatar,
      memberCount: conversation.memberCount,
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        nickname: p.user.nickname,
        avatar: p.user.avatar,
        isVerified: p.user.isVerified,
        role: p.role,
      })),
      isNew: true,
    });
  } catch (error) {
    console.error('创建群聊失败:', error);
    return NextResponse.json({ error: '创建群聊失败' }, { status: 500 });
  }
}
