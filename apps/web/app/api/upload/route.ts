// app/api/upload/route.ts
/**
 * 图片上传 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
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

    // 2️⃣ 解析 FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_INPUT',
          message: '请选择要上传的图片',
        },
        { status: 400 }
      );
    }

    // 3️⃣ 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_FILE_TYPE',
          message: '只支持 JPG、PNG、GIF、WebP 格式的图片',
        },
        { status: 400 }
      );
    }

    // 4️⃣ 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FILE_TOO_LARGE',
          message: '图片大小不能超过 10MB',
        },
        { status: 400 }
      );
    }

    // 5️⃣ 生成文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}.${ext}`;

    // 6️⃣ 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 7️⃣ 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 8️⃣ 返回文件URL
    const imageUrl = `/uploads/posts/${fileName}`;

    console.log('[UPLOAD_SUCCESS]', {
      userId: payload.id,
      fileName,
      size: file.size,
      type: file.type,
    });

    return NextResponse.json({
      ok: true,
      data: {
        imageUrl,
        fileName,
        size: file.size,
        type: file.type,
      },
      message: '上传成功',
    });
  } catch (error: unknown) {
    console.error('[UPLOAD_ERROR]', error);
    return NextResponse.json(
      {
        ok: false,
        code: 'SERVER_ERROR',
        message: '上传失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
