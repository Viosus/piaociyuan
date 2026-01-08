// app/api/tickets/transfer/[code]/route.ts
/**
 * 查询转让详情 API（通过转让码）
 *
 * GET: 获取转让详情
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET - 通过转让码获取转让详情
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PARAMS', message: '请提供转让码' },
        { status: 400 }
      );
    }

    // 查询转让记录
    const transfer = await prisma.ticketTransfer.findUnique({
      where: { transferCode: code.toUpperCase() },
    });

    if (!transfer) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '转让码无效' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (transfer.status === 'pending' && new Date() > transfer.expiresAt) {
      await prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'expired' },
      });
      transfer.status = 'expired';
    }

    // 获取门票信息
    const ticket = await prisma.ticket.findUnique({
      where: { id: transfer.ticketId },
    });

    // 获取活动信息
    let event = null;
    let tier = null;
    if (ticket) {
      [event, tier] = await Promise.all([
        prisma.event.findUnique({
          where: { id: ticket.eventId },
          select: { id: true, name: true, date: true, time: true, venue: true, city: true, cover: true },
        }),
        prisma.tier.findUnique({
          where: { id: ticket.tierId },
          select: { id: true, name: true, price: true },
        }),
      ]);
    }

    // 获取转让人信息
    const fromUser = await prisma.user.findUnique({
      where: { id: transfer.fromUserId },
      select: { id: true, nickname: true, avatar: true, isVerified: true, verifiedType: true },
    });

    // 获取关联的 NFT 信息
    let nftInfo = null;
    if (ticket?.nftUserNftId) {
      const userNFT = await prisma.userNFT.findUnique({
        where: { id: ticket.nftUserNftId },
      });
      if (userNFT) {
        const nft = await prisma.nFT.findUnique({
          where: { id: userNFT.nftId },
          select: { id: true, name: true, imageUrl: true, rarity: true, description: true },
        });
        nftInfo = {
          userNftId: userNFT.id,
          nft,
          isOnChain: userNFT.isOnChain,
          mintStatus: userNFT.mintStatus,
        };
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: transfer.id,
        transferCode: transfer.transferCode,
        transferType: transfer.transferType,
        price: transfer.price,
        message: transfer.message,
        status: transfer.status,
        expiresAt: transfer.expiresAt,
        createdAt: transfer.createdAt,
        ticket: ticket ? {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          price: ticket.price,
          seatNumber: ticket.seatNumber,
        } : null,
        event,
        tier,
        fromUser,
        nft: nftInfo, // 包含 NFT 信息
        hasNFT: !!nftInfo, // 便于前端快速判断
      },
    });
  } catch (error: unknown) {
    console.error('[TICKET_TRANSFER_DETAIL_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '服务器错误' },
      { status: 500 }
    );
  }
}
