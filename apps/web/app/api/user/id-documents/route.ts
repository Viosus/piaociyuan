// app/api/user/id-documents/route.ts
/**
 * 用户证件管理 API
 *
 * GET /api/user/id-documents - 获取用户所有证件
 * POST /api/user/id-documents - 添加新证件
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 证件类型
const VALID_ID_TYPES = ['china_id', 'passport', 'hk_permit', 'tw_permit'];

// 身份证校验
function validateChinaId(idNumber: string): { valid: boolean; error?: string } {
  const regex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

  if (!regex.test(idNumber)) {
    return { valid: false, error: '身份证号格式不正确' };
  }

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idNumber[i]) * weights[i];
  }

  const expectedChecksum = checksums[sum % 11];
  const actualChecksum = idNumber[17].toUpperCase();

  if (expectedChecksum !== actualChecksum) {
    return { valid: false, error: '身份证号校验位不正确' };
  }

  return { valid: true };
}

// 护照校验
function validatePassport(idNumber: string): { valid: boolean; error?: string } {
  const chinaRegex = /^[EGeg]\d{8}$/;
  const internationalRegex = /^[A-Za-z0-9]{6,9}$/;

  if (!chinaRegex.test(idNumber) && !internationalRegex.test(idNumber)) {
    return { valid: false, error: '护照号格式不正确' };
  }

  return { valid: true };
}

// 港澳通行证校验
function validateHkPermit(idNumber: string): { valid: boolean; error?: string } {
  const regex = /^[CWcw]\d{8}$/;

  if (!regex.test(idNumber)) {
    return { valid: false, error: '港澳通行证号格式不正确' };
  }

  return { valid: true };
}

// 台湾通行证校验
function validateTwPermit(idNumber: string): { valid: boolean; error?: string } {
  const regex = /^[Tt]\d{8}$/;

  if (!regex.test(idNumber)) {
    return { valid: false, error: '台湾通行证号格式不正确' };
  }

  return { valid: true };
}

// 根据类型验证证件号
function validateIdNumber(idType: string, idNumber: string): { valid: boolean; error?: string } {
  switch (idType) {
    case 'china_id':
      return validateChinaId(idNumber);
    case 'passport':
      return validatePassport(idNumber);
    case 'hk_permit':
      return validateHkPermit(idNumber);
    case 'tw_permit':
      return validateTwPermit(idNumber);
    default:
      return { valid: false, error: '未知的证件类型' };
  }
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

    // 2. 获取用户所有证件
    const documents = await prisma.userIdDocument.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      ok: true,
      data: documents,
    });
  } catch (error: unknown) {
    console.error('[ID_DOCUMENTS_GET_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '获取证件列表失败',
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
      idType,
      fullName,
      idNumber,
      issueDate,
      expiryDate,
      issuingAuthority,
      nationality,
      birthDate,
      gender,
    } = body;

    // 3. 验证必填字段
    if (!idType || !fullName || !idNumber) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '请填写证件类型、姓名和证件号码' },
        { status: 400 }
      );
    }

    // 4. 验证证件类型
    if (!VALID_ID_TYPES.includes(idType)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: '无效的证件类型' },
        { status: 400 }
      );
    }

    // 5. 验证证件号码格式
    const validation = validateIdNumber(idType, idNumber);
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', message: validation.error },
        { status: 400 }
      );
    }

    // 6. 检查是否已存在相同证件
    const existing = await prisma.userIdDocument.findFirst({
      where: {
        userId,
        idType,
        idNumber: idNumber.toUpperCase(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, code: 'DUPLICATE', message: '该证件已存在' },
        { status: 400 }
      );
    }

    // 7. 检查是否是第一个证件（设为默认）
    const count = await prisma.userIdDocument.count({ where: { userId } });
    const isDefault = count === 0;

    // 8. 创建证件
    const document = await prisma.userIdDocument.create({
      data: {
        userId,
        idType,
        fullName: fullName.trim(),
        idNumber: idNumber.toUpperCase(),
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        issuingAuthority: issuingAuthority?.trim() || null,
        nationality: nationality?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        isDefault,
      },
    });

    return NextResponse.json({
      ok: true,
      message: '证件添加成功',
      data: document,
    });
  } catch (error: unknown) {
    console.error('[ID_DOCUMENTS_POST_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '添加证件失败',
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
