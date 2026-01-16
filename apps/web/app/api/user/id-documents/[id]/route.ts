// app/api/user/id-documents/[id]/route.ts
/**
 * 单个证件管理 API
 *
 * GET /api/user/id-documents/:id - 获取单个证件详情
 * PUT /api/user/id-documents/:id - 更新证件信息
 * DELETE /api/user/id-documents/:id - 删除证件
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 安全解析日期字符串，处理空字符串和无效值
function parseDate(value: string | null | undefined): Date | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
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

    // 2. 获取证件
    const document = await prisma.userIdDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '证件不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (document.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权访问此证件' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: document,
    });
  } catch (error: unknown) {
    console.error('[ID_DOCUMENT_GET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取证件详情失败',
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

    // 2. 获取证件
    const document = await prisma.userIdDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '证件不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (document.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权修改此证件' },
        { status: 403 }
      );
    }

    // 4. 解析请求体
    const body = await req.json();
    const {
      fullName,
      issueDate,
      expiryDate,
      issuingAuthority,
      nationality,
      birthDate,
      gender,
    } = body;

    // 5. 更新证件（不允许修改证件类型和号码）
    // 处理日期字段：undefined 表示不修改，null 或空字符串表示清空
    const parsedIssueDate = issueDate === undefined ? document.issueDate : parseDate(issueDate);
    const parsedExpiryDate = expiryDate === undefined ? document.expiryDate : parseDate(expiryDate);
    const parsedBirthDate = birthDate === undefined ? document.birthDate : parseDate(birthDate);

    const updated = await prisma.userIdDocument.update({
      where: { id },
      data: {
        fullName: fullName?.trim() || document.fullName,
        issueDate: parsedIssueDate,
        expiryDate: parsedExpiryDate,
        issuingAuthority: issuingAuthority?.trim() ?? document.issuingAuthority,
        nationality: nationality?.trim() ?? document.nationality,
        birthDate: parsedBirthDate,
        gender: gender ?? document.gender,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '证件更新成功',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('[ID_DOCUMENT_PUT_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '更新证件失败',
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

    // 2. 获取证件
    const document = await prisma.userIdDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: '证件不存在' },
        { status: 404 }
      );
    }

    // 3. 验证所有权
    if (document.userId !== userId) {
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: '无权删除此证件' },
        { status: 403 }
      );
    }

    // 4. 删除证件
    await prisma.userIdDocument.delete({
      where: { id },
    });

    // 5. 如果删除的是默认证件，设置另一个为默认
    if (document.isDefault) {
      const nextDefault = await prisma.userIdDocument.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDefault) {
        await prisma.userIdDocument.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: '证件删除成功',
    });
  } catch (error: unknown) {
    console.error('[ID_DOCUMENT_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '删除证件失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
