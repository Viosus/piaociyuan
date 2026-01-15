// app/api/user/addresses/route.ts
/**
 * 用户地址管理 API
 *
 * GET /api/user/addresses - 获取用户所有地址
 * POST /api/user/addresses - 添加新地址
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

export async function GET(req: NextRequest) {
  try {
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

    // 2. 获取用户所有地址
    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      ok: true,
      data: addresses,
    });
  } catch (error: unknown) {
    console.error('[ADDRESSES_GET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取地址列表失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    // 2. 解析请求体
    const body = await req.json();
    const {
      recipientName,
      recipientPhone,
      country = '中国',
      province,
      city,
      district,
      street,
      addressDetail,
      postalCode,
      label,
    } = body;

    // 3. 验证必填字段
    if (!recipientName || !recipientPhone || !province || !city || !district || !addressDetail) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '请填写收件人、电话、省市区和详细地址' },
        { status: 400 }
      );
    }

    // 4. 验证收件人姓名
    if (recipientName.trim().length > 20) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '收件人姓名不能超过20个字符' },
        { status: 400 }
      );
    }

    // 5. 验证电话号码
    const isValidPhone = country === '中国'
      ? validateChinaPhone(recipientPhone)
      : validateInternationalPhone(recipientPhone);

    if (!isValidPhone) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '请输入正确的电话号码' },
        { status: 400 }
      );
    }

    // 6. 验证详细地址长度
    if (addressDetail.trim().length > 200) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '详细地址不能超过200个字符' },
        { status: 400 }
      );
    }

    // 7. 验证标签
    if (label && !VALID_LABELS.includes(label)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的地址标签' },
        { status: 400 }
      );
    }

    // 8. 检查是否是第一个地址（设为默认）
    const count = await prisma.userAddress.count({ where: { userId } });
    const isDefault = count === 0;

    // 9. 创建地址
    const address = await prisma.userAddress.create({
      data: {
        userId,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        country: country.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        street: street?.trim() || null,
        addressDetail: addressDetail.trim(),
        postalCode: postalCode?.trim() || null,
        label: label || null,
        isDefault,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '地址添加成功',
      data: address,
    });
  } catch (error: unknown) {
    console.error('[ADDRESSES_POST_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '添加地址失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
