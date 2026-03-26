/**
 * 可铸造订单列表 API
 * GET /api/nft/mint/orders
 *
 * 查询已支付且可铸造 NFT 的订单
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(req: NextRequest) {
  try {
    // 认证
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

    // 查询已支付的订单
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取关联的活动和票档信息
    const result = await Promise.all(
      orders.map(async (order) => {
        const [event, tier] = await Promise.all([
          prisma.event.findUnique({
            where: { id: parseInt(order.eventId) },
            select: { id: true, name: true, cover: true },
          }),
          prisma.tier.findUnique({
            where: { id: parseInt(order.tierId) },
            select: { id: true, name: true },
          }),
        ]);

        // 检查是否已有 NFT 铸造记录
        const existingMint = await prisma.userNFT.findFirst({
          where: {
            userId,
            sourceId: order.id,
          },
        });

        const nftMinted = !!existingMint;

        return {
          id: order.id,
          event: {
            id: event?.id || parseInt(order.eventId),
            name: event?.name || '未知活动',
            imageUrl: event?.cover || '',
          },
          tier: {
            id: tier?.id || parseInt(order.tierId),
            name: tier?.name || '未知票档',
          },
          qty: order.qty,
          totalAmount: order.qty * (tier?.price || 0),
          paidAt: order.paidAt ? new Date(Number(order.paidAt)).toISOString() : null,
          canMintNFT: !nftMinted,
          nftMinted,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[MINT_ORDERS_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '查询可铸造订单失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
