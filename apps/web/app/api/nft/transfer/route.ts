// app/api/nft/transfer/route.ts
/**
 * NFT 转让/赠送 API
 *
 * POST: 发起转让
 * GET: 获取我的转让记录
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

// 生成转让码
function generateTransferCode(): string {
  return nanoid(8).toUpperCase();
}

/**
 * POST - 发起 NFT 转让/赠送
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    const userId = payload.id;
    const body = await req.json();
    const { userNftId, transferType = 'gift', price, message, toUserPhone, toUserEmail, expiresInHours = 48 } = body;

    if (!userNftId) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供 NFT ID' },
        { status: 400 }
      );
    }

    // 查询 UserNFT
    const userNft = await prisma.userNFT.findUnique({
      where: { id: userNftId },
      include: {
        nft: true,
      },
    });

    if (!userNft) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'NFT 不存在' },
        { status: 404 }
      );
    }

    // 验证 NFT 所有权
    if (userNft.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '只能转让自己的 NFT' },
        { status: 403 }
      );
    }

    // 检查 NFT 状态 - 必须已铸造
    if (userNft.mintStatus !== 'minted') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATUS', message: 'NFT 尚未铸造完成，无法转让' },
        { status: 400 }
      );
    }

    // 检查是否有未完成的转让
    const existingTransfer = await prisma.nFTTransfer.findFirst({
      where: {
        userNftId,
        status: 'pending',
      },
    });

    if (existingTransfer) {
      return NextResponse.json(
        { ok: false, code: 'TRANSFER_EXISTS', message: '该 NFT 已有待处理的转让，请先取消' },
        { status: 400 }
      );
    }

    // 验证转让价格（出售模式）
    if (transferType === 'sale' && (!price || price <= 0)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '出售模式需要设置有效价格' },
        { status: 400 }
      );
    }

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // 创建转让记录
    const transfer = await prisma.nFTTransfer.create({
      data: {
        userNftId,
        fromUserId: userId,
        transferCode: generateTransferCode(),
        transferType,
        price: transferType === 'sale' ? price : null,
        message,
        toUserPhone,
        toUserEmail,
        expiresAt,
        status: 'pending',
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        expiresAt: transfer.expiresAt,
        status: transfer.status,
      },
      message: '转让发起成功',
    });
  } catch (error: unknown) {
    console.error('[NFT_TRANSFER_CREATE_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * GET - 获取我的 NFT 转让记录
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '未提供认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: '认证信息无效或已过期' },
        { status: 401 }
      );
    }

    const userId = payload.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sent'; // sent(发出的) / received(收到的)
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (type === 'sent') {
      where.fromUserId = userId;
    } else {
      where.toUserId = userId;
    }

    if (status) {
      where.status = status;
    }

    const [transfers, total] = await Promise.all([
      prisma.nFTTransfer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.nFTTransfer.count({ where }),
    ]);

    // 获取关联的 UserNFT 信息
    const userNftIds = transfers.map(t => t.userNftId);
    const userNfts = await prisma.userNFT.findMany({
      where: { id: { in: userNftIds } },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            description: true,
          },
        },
      },
    });
    const userNftMap = new Map(userNfts.map(n => [n.id, n]));

    // 获取用户信息
    const userIds = [...new Set([
      ...transfers.map(t => t.fromUserId),
      ...transfers.filter(t => t.toUserId).map(t => t.toUserId!),
    ])];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatar: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const result = transfers.map(transfer => {
      const userNft = userNftMap.get(transfer.userNftId);
      const fromUser = userMap.get(transfer.fromUserId);
      const toUser = transfer.toUserId ? userMap.get(transfer.toUserId) : null;

      return {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        status: transfer.status,
        expiresAt: transfer.expiresAt,
        createdAt: transfer.createdAt,
        acceptedAt: transfer.acceptedAt,
        userNft: userNft ? {
          id: userNft.id,
          tokenId: userNft.tokenId,
          contractAddress: userNft.contractAddress,
          isOnChain: userNft.isOnChain,
          mintStatus: userNft.mintStatus,
        } : null,
        nft: userNft?.nft || null,
        fromUser,
        toUser,
      };
    });

    return NextResponse.json({
      ok: true,
      data: result,
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error('[NFT_TRANSFER_LIST_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
