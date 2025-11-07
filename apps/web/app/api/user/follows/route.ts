// app/api/user/follows/route.ts
/**
 * 我关注的活动 API
 *
 * 功能：
 * - 获取用户关注的所有活动
 * - 支持按状态筛选（在售中、已结束）
 * - 支持分页
 * - 返回活动的基本信息和票档信息
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getSaleStatusInfo } from '@/lib/eventUtils';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ 认证
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '未提供认证信息',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: '认证信息无效或已过期',
        },
        { status: 401 }
      );
    }

    const userId = payload.id;

    // 2️⃣ 获取查询参数
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // onsale, ended
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[USER_FOLLOWS] 查询参数:', { userId, status, limit, offset });

    // 3️⃣ 查询用户关注的活动
    const follows = await prisma.eventFollow.findMany({
      where: {
        userId,
      },
      include: {
        event: {
          include: {
            tiers: {
              orderBy: {
                price: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 最新关注的在前
      },
      skip: offset,
      take: limit,
    });

    // 4️⃣ 根据状态筛选活动（使用新的 saleStatus）
    let filteredFollows = follows;

    if (status) {
      filteredFollows = follows.filter((follow) => {
        const event = follow.event;
        const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);

        if (status === 'upcoming') {
          // 即将开售：not_started
          return saleInfo.saleStatus === 'not_started';
        } else if (status === 'onsale') {
          // 热卖中：on_sale
          return saleInfo.saleStatus === 'on_sale';
        } else if (status === 'ended') {
          // 已结束：ended, paused, sold_out
          return ['ended', 'paused', 'sold_out'].includes(saleInfo.saleStatus);
        }
        return true;
      });
    }

    // 5️⃣ 计算每个活动的状态和库存信息
    const eventsWithStatus = await Promise.all(
      filteredFollows.map(async (follow) => {
        const event = follow.event;

        // 使用新的 saleStatus 计算活动状态
        const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);

        // 映射到前端期望的状态
        let eventStatus: 'upcoming' | 'onsale' | 'ended';
        if (saleInfo.saleStatus === 'not_started') {
          eventStatus = 'upcoming';
        } else if (saleInfo.saleStatus === 'on_sale') {
          eventStatus = 'onsale';
        } else {
          eventStatus = 'ended';
        }

        // 计算总库存和剩余库存
        const totalCapacity = event.tiers.reduce((sum, tier) => sum + tier.capacity, 0);

        // 查询已售出的票数
        const soldTickets = await prisma.ticket.count({
          where: {
            eventId: event.id,
            status: {
              in: ['sold', 'used'],
            },
          },
        });

        const availableCapacity = Math.max(0, totalCapacity - soldTickets);
        const soldPercentage = totalCapacity > 0 ? Math.round((soldTickets / totalCapacity) * 100) : 0;

        // 计算最低价格
        const lowestPrice = event.tiers.length > 0
          ? Math.min(...event.tiers.map((tier) => tier.price))
          : 0;

        return {
          followId: follow.id,
          followedAt: follow.createdAt.toISOString(),
          event: {
            id: event.id,
            name: event.name,
            artist: event.artist,
            city: event.city,
            venue: event.venue,
            date: event.date,
            time: event.time,
            cover: event.cover,
            status: eventStatus,
            saleStartTime: event.saleStartTime ? event.saleStartTime.toISOString() : null,
            // 库存信息
            totalCapacity,
            availableCapacity,
            soldTickets,
            soldPercentage,
            // 价格信息
            lowestPrice,
            tiers: event.tiers.map((tier) => ({
              id: tier.id,
              name: tier.name,
              price: tier.price,
              capacity: tier.capacity,
            })),
          },
        };
      })
    );

    // 6️⃣ 统计信息（始终显示全部关注的统计，不受筛选影响）
    const totalCount = await prisma.eventFollow.count({
      where: { userId },
    });

    // 如果应用了筛选，需要先获取所有活动来计算正确的统计
    let allEventsWithStatus = eventsWithStatus;
    if (status) {
      // 重新查询所有关注的活动（不带状态筛选）
      const allFollows = await prisma.eventFollow.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              tiers: {
                orderBy: {
                  price: 'asc',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      allEventsWithStatus = await Promise.all(
        allFollows.map(async (follow) => {
          const event = follow.event;

          // 使用新的 saleStatus 计算活动状态
          const saleInfo = getSaleStatusInfo(event.saleStatus, event.saleStartTime, event.saleEndTime);

          // 映射到前端期望的状态
          let eventStatus: 'upcoming' | 'onsale' | 'ended';
          if (saleInfo.saleStatus === 'not_started') {
            eventStatus = 'upcoming';
          } else if (saleInfo.saleStatus === 'on_sale') {
            eventStatus = 'onsale';
          } else {
            eventStatus = 'ended';
          }

          const totalCapacity = event.tiers.reduce((sum, tier) => sum + tier.capacity, 0);
          const soldTickets = await prisma.ticket.count({
            where: {
              eventId: event.id,
              status: {
                in: ['sold', 'used'],
              },
            },
          });

          const availableCapacity = Math.max(0, totalCapacity - soldTickets);
          const soldPercentage = totalCapacity > 0 ? Math.round((soldTickets / totalCapacity) * 100) : 0;
          const lowestPrice = event.tiers.length > 0 ? Math.min(...event.tiers.map((tier) => tier.price)) : 0;

          return {
            followId: follow.id,
            followedAt: follow.createdAt.toISOString(),
            event: {
              id: event.id,
              name: event.name,
              artist: event.artist,
              city: event.city,
              venue: event.venue,
              date: event.date,
              time: event.time,
              cover: event.cover,
              status: eventStatus,
              saleStartTime: event.saleStartTime ? event.saleStartTime.toISOString() : null,
              totalCapacity,
              availableCapacity,
              soldTickets,
              soldPercentage,
              lowestPrice,
              tiers: event.tiers.map((tier) => ({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                capacity: tier.capacity,
              })),
            },
          };
        })
      );
    }

    const stats = {
      total: totalCount,
      upcoming: allEventsWithStatus.filter((e) => e.event.status === 'upcoming').length,
      onsale: allEventsWithStatus.filter((e) => e.event.status === 'onsale').length,
      ended: allEventsWithStatus.filter((e) => e.event.status === 'ended').length,
    };

    console.log('[USER_FOLLOWS] 查询成功:', stats);

    return NextResponse.json({
      ok: true,
      data: eventsWithStatus,
      stats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error: unknown) {
    console.error('[USER_FOLLOWS_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '查询关注列表失败',
      },
      { status: 500 }
    );
  }
}
