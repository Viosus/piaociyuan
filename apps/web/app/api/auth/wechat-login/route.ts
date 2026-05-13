// app/api/auth/wechat-login/route.ts
// 微信小程序登录：wx.login 拿 code → 后端调 code2Session 拿 openid → 颁发自家 JWT
import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createUserSession, extractDeviceInfo, getClientIP } from '@/lib/session';

interface Code2SessionOk {
  openid: string;
  session_key: string;
  unionid?: string;
}
interface Code2SessionErr {
  errcode: number;
  errmsg: string;
}
type Code2SessionResp = Code2SessionOk | Code2SessionErr;

export async function POST(req: NextRequest) {
  try {
    const { code, nickname, avatar } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { ok: false, error: '缺少 code 参数' },
        { status: 400 }
      );
    }

    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;
    if (!appid || !secret) {
      console.error('[WECHAT_LOGIN] WX_APPID / WX_SECRET not configured');
      return NextResponse.json(
        { ok: false, error: '服务端未配置微信小程序凭证' },
        { status: 500 }
      );
    }

    // 调微信 jscode2session
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const wxRes = await fetch(url, { method: 'GET' });
    const wxData: Code2SessionResp = await wxRes.json();

    if ('errcode' in wxData && wxData.errcode !== 0) {
      console.error('[WECHAT_LOGIN] code2Session 失败:', wxData);
      return NextResponse.json(
        { ok: false, error: `微信登录失败：${wxData.errmsg}` },
        { status: 401 }
      );
    }

    const openid = (wxData as Code2SessionOk).openid;
    if (!openid) {
      return NextResponse.json(
        { ok: false, error: '微信未返回 openid' },
        { status: 401 }
      );
    }

    // 查或建用户
    let user = await prisma.user.findUnique({ where: { wechatOpenId: openid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          wechatOpenId: openid,
          authProvider: 'wechat',
          nickname: nickname || '微信用户',
          avatar: avatar || null,
          role: 'user',
        },
      });
      console.log(`[WECHAT_LOGIN] 新用户已创建: ${user.id} (openid=${openid})`);
    } else if (nickname || avatar) {
      // 已有用户：如果客户端传了新昵称 / 头像，更新
      const updates: { nickname?: string; avatar?: string } = {};
      if (nickname && !user.nickname) updates.nickname = nickname;
      if (avatar && !user.avatar) updates.avatar = avatar;
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    }

    if (user.isBanned) {
      return NextResponse.json(
        { ok: false, error: '该账号已被封禁' },
        { status: 403 }
      );
    }

    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      nickname: user.nickname ?? undefined,
      authProvider: user.authProvider,
      role: user.role,
    });

    // session 记录
    const ipAddress = getClientIP(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    const deviceInfo = extractDeviceInfo(userAgent);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await createUserSession({
      userId: user.id,
      refreshToken,
      deviceInfo: `wechat-miniprogram | ${deviceInfo}`,
      ipAddress,
      expiresAt,
    });

    return NextResponse.json({
      ok: true,
      data: {
        accessToken,
        refreshToken,
        token: accessToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          wechatOpenId: user.wechatOpenId,
        },
      },
    });
  } catch (error: unknown) {
    console.error('[WECHAT_LOGIN] 异常:', error);
    return NextResponse.json(
      { ok: false, error: '微信登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
