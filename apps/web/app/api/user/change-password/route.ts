/**
 * 修改密码 API
 * POST /api/user/change-password
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, verifyPassword, hashPassword, isValidPassword } from '@/lib/auth';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(req: NextRequest) {
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

    // 解析请求体
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: '请提供当前密码和新密码' },
        { status: 400 }
      );
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: '新密码至少8位，需包含字母和数字' },
        { status: 400 }
      );
    }

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { ok: false, code: 'BAD_REQUEST', message: '当前账号不支持密码修改' },
        { status: 400 }
      );
    }

    // 验证当前密码
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PASSWORD', message: '当前密码不正确' },
        { status: 400 }
      );
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    console.log(`[CHANGE_PASSWORD] 密码已修改: userId=${userId}`);

    return NextResponse.json({
      ok: true,
      message: '密码修改成功',
    });
  } catch (error: unknown) {
    console.error('[CHANGE_PASSWORD_ERROR]', error);
    return NextResponse.json(
      { ok: false, code: 'SERVER_ERROR', message: '修改密码失败', error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
