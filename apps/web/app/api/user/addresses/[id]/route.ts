// app/api/user/addresses/[id]/route.ts
/**
 * 单个地址管理 API
 *
 * GET /api/user/addresses/:id - 获取单个地址详情
 * PUT /api/user/addresses/:id - 更新地址
 * DELETE /api/user/addresses/:id - 删除地址
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 地址标签
const VALID_LABELS = ['home', 'work', 'other'];

// 中国手机号验证
function validateChinaPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 国际电话验证
function validateInternationalPhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,15}$/.test(phone);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 认证
    const authHeader = req.headers.get('Authorization');
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

    // 2. 获取地址
    const address = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '地址不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (address.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权访问此地址' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: address,
    });
  } catch (error: unknown) {
    console.error('[ADDRESS_GET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取地址详情失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 认证
    const authHeader = req.headers.get('Authorization');
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

    // 2. 获取地址
    const address = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '地址不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (address.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权修改此地址' },
        { status: 403 }
      );
    }

    // 4. 解析请求体
    const body = await req.json();
    const {
      recipientName,
      recipientPhone,
      country,
      province,
      city,
      district,
      street,
      addressDetail,
      postalCode,
      label,
    } = body;

    // 5. 验证收件人姓名
    if (recipientName && recipientName.trim().length > 20) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '收件人姓名不能超过20个字符' },
        { status: 400 }
      );
    }

    // 6. 验证电话号码
    if (recipientPhone) {
      const targetCountry = country || address.country;
      const isValidPhone = targetCountry === '中国'
        ? validateChinaPhone(recipientPhone)
        : validateInternationalPhone(recipientPhone);

      if (!isValidPhone) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_INPUT', message: '请输入正确的电话号码' },
          { status: 400 }
        );
      }
    }

    // 7. 验证详细地址长度
    if (addressDetail && addressDetail.trim().length > 200) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '详细地址不能超过200个字符' },
        { status: 400 }
      );
    }

    // 8. 验证标签
    if (label && !VALID_LABELS.includes(label)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的地址标签' },
        { status: 400 }
      );
    }

    // 9. 更新地址
    const updated = await prisma.userAddress.update({
      where: { id },
      data: {
        recipientName: recipientName?.trim() || address.recipientName,
        recipientPhone: recipientPhone?.trim() || address.recipientPhone,
        country: country?.trim() || address.country,
        province: province?.trim() || address.province,
        city: city?.trim() || address.city,
        district: district?.trim() || address.district,
        street: street !== undefined ? (street?.trim() || null) : address.street,
        addressDetail: addressDetail?.trim() || address.addressDetail,
        postalCode: postalCode !== undefined ? (postalCode?.trim() || null) : address.postalCode,
        label: label !== undefined ? (label || null) : address.label,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '地址更新成功',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('[ADDRESS_PUT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '更新地址失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 认证
    const authHeader = req.headers.get('Authorization');
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

    // 2. 获取地址
    const address = await prisma.userAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '地址不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (address.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权删除此地址' },
        { status: 403 }
      );
    }

    // 4. 删除地址
    await prisma.userAddress.delete({
      where: { id },
    });

    // 5. 如果删除的是默认地址，设置另一个为默认
    if (address.isDefault) {
      const nextDefault = await prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDefault) {
        await prisma.userAddress.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: '地址删除成功',
    });
  } catch (error: unknown) {
    console.error('[ADDRESS_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除地址失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
