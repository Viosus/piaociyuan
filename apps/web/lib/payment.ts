/**
 * 支付工具库 - 微信支付 & 支付宝
 *
 * 使用说明：
 * 1. 微信支付：需要在微信商户平台申请商户号，配置API证书
 * 2. 支付宝：需要在支付宝开放平台创建应用，配置密钥
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// 类型定义
// ============================================

export interface PaymentConfig {
  wechat: {
    appId: string;
    mchId: string;
    apiKey: string;
    apiV3Key: string;
    serialNo: string;
    privateKey: string;
    notifyUrl: string;
  };
  alipay: {
    appId: string;
    privateKey: string;
    alipayPublicKey: string;
    notifyUrl: string;
    returnUrl: string;
  };
  env: 'sandbox' | 'production';
}

export interface CreateOrderParams {
  orderId: string;
  amount: number; // 单位：分
  description: string;
  openId?: string; // 微信支付需要
  clientIp?: string;
}

export interface WechatPayResult {
  prepayId: string;
  // APP支付参数
  appPayParams?: {
    appid: string;
    partnerid: string;
    prepayid: string;
    package: string;
    noncestr: string;
    timestamp: string;
    sign: string;
  };
  // JSAPI支付参数
  jsapiPayParams?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  };
  // Native支付二维码链接
  codeUrl?: string;
}

export interface AlipayResult {
  // APP支付：返回签名后的订单字符串
  orderString?: string;
  // 网页支付：返回跳转URL
  payUrl?: string;
}

export interface RefundParams {
  orderId: string;
  refundId: string;
  totalAmount: number; // 原订单金额，单位：分
  refundAmount: number; // 退款金额，单位：分
  reason?: string;
}

export interface PaymentNotification {
  orderId: string;
  transactionId: string;
  amount: number;
  paidAt: Date;
  raw: any;
}

// ============================================
// 配置加载
// ============================================

export function getPaymentConfig(): PaymentConfig {
  return {
    wechat: {
      appId: process.env.WECHAT_APP_ID || '',
      mchId: process.env.WECHAT_MCH_ID || '',
      apiKey: process.env.WECHAT_API_KEY || '',
      apiV3Key: process.env.WECHAT_API_V3_KEY || '',
      serialNo: process.env.WECHAT_SERIAL_NO || '',
      privateKey: process.env.WECHAT_PRIVATE_KEY || '',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
      returnUrl: process.env.ALIPAY_RETURN_URL || '',
    },
    env: (process.env.PAYMENT_ENV as 'sandbox' | 'production') || 'sandbox',
  };
}

// ============================================
// 微信支付
// ============================================

const WECHAT_API_BASE = 'https://api.mch.weixin.qq.com';

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 微信支付 V3 签名
 */
function signWechatV3(
  method: string,
  url: string,
  timestamp: string,
  nonceStr: string,
  body: string,
  privateKey: string
): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(privateKey, 'base64');
}

/**
 * 微信支付 V3 验签
 */
function verifyWechatV3Signature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  publicKey: string
): boolean {
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(message);
  return verify.verify(publicKey, signature, 'base64');
}

/**
 * 微信支付 V3 解密
 */
function decryptWechatV3(
  ciphertext: string,
  associatedData: string,
  nonce: string,
  apiV3Key: string
): string {
  const key = Buffer.from(apiV3Key, 'utf8');
  const iv = Buffer.from(nonce, 'utf8');
  const authTag = Buffer.from(ciphertext.slice(-16), 'base64');
  const data = Buffer.from(ciphertext.slice(0, -16), 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, 'utf8'));

  let decrypted = decipher.update(data, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 创建微信支付订单（APP支付）
 */
export async function createWechatPayOrder(
  params: CreateOrderParams,
  config: PaymentConfig
): Promise<WechatPayResult> {
  const { wechat } = config;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();

  const requestBody = {
    appid: wechat.appId,
    mchid: wechat.mchId,
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: wechat.notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
  };

  const url = '/v3/pay/transactions/app';
  const body = JSON.stringify(requestBody);
  const signature = signWechatV3('POST', url, timestamp, nonceStr, body, wechat.privateKey);

  const response = await fetch(`${WECHAT_API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${wechat.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${wechat.serialNo}",signature="${signature}"`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`微信支付创建订单失败: ${error.message || JSON.stringify(error)}`);
  }

  const result = await response.json();

  // 生成APP调起支付的参数
  const appTimestamp = Math.floor(Date.now() / 1000).toString();
  const appNonceStr = generateNonceStr();
  const signMessage = `${wechat.appId}\n${appTimestamp}\n${appNonceStr}\nprepay_id=${result.prepay_id}\n`;
  const appSign = crypto.createSign('RSA-SHA256');
  appSign.update(signMessage);
  const paySign = appSign.sign(wechat.privateKey, 'base64');

  return {
    prepayId: result.prepay_id,
    appPayParams: {
      appid: wechat.appId,
      partnerid: wechat.mchId,
      prepayid: result.prepay_id,
      package: 'Sign=WXPay',
      noncestr: appNonceStr,
      timestamp: appTimestamp,
      sign: paySign,
    },
  };
}

/**
 * 创建微信支付订单（Native支付 - 二维码）
 */
export async function createWechatNativeOrder(
  params: CreateOrderParams,
  config: PaymentConfig
): Promise<WechatPayResult> {
  const { wechat } = config;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();

  const requestBody = {
    appid: wechat.appId,
    mchid: wechat.mchId,
    description: params.description,
    out_trade_no: params.orderId,
    notify_url: wechat.notifyUrl,
    amount: {
      total: params.amount,
      currency: 'CNY',
    },
  };

  const url = '/v3/pay/transactions/native';
  const body = JSON.stringify(requestBody);
  const signature = signWechatV3('POST', url, timestamp, nonceStr, body, wechat.privateKey);

  const response = await fetch(`${WECHAT_API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${wechat.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${wechat.serialNo}",signature="${signature}"`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`微信支付创建订单失败: ${error.message || JSON.stringify(error)}`);
  }

  const result = await response.json();

  return {
    prepayId: '',
    codeUrl: result.code_url,
  };
}

/**
 * 解析微信支付回调
 */
export function parseWechatNotification(
  body: string,
  headers: {
    timestamp: string;
    nonce: string;
    signature: string;
    serial: string;
  },
  config: PaymentConfig,
  wechatPublicKey: string
): PaymentNotification | null {
  // 验证签名
  const isValid = verifyWechatV3Signature(
    headers.timestamp,
    headers.nonce,
    body,
    headers.signature,
    wechatPublicKey
  );

  if (!isValid) {
    console.error('微信支付回调签名验证失败');
    return null;
  }

  const notification = JSON.parse(body);

  // 解密数据
  const resource = notification.resource;
  const decrypted = decryptWechatV3(
    resource.ciphertext,
    resource.associated_data,
    resource.nonce,
    config.wechat.apiV3Key
  );

  const data = JSON.parse(decrypted);

  return {
    orderId: data.out_trade_no,
    transactionId: data.transaction_id,
    amount: data.amount.total,
    paidAt: new Date(data.success_time),
    raw: data,
  };
}

/**
 * 微信支付退款
 */
export async function refundWechatPay(
  params: RefundParams,
  transactionId: string,
  config: PaymentConfig
): Promise<{ refundId: string; status: string }> {
  const { wechat } = config;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();

  const requestBody = {
    transaction_id: transactionId,
    out_refund_no: params.refundId,
    reason: params.reason || '用户申请退款',
    amount: {
      refund: params.refundAmount,
      total: params.totalAmount,
      currency: 'CNY',
    },
  };

  const url = '/v3/refund/domestic/refunds';
  const body = JSON.stringify(requestBody);
  const signature = signWechatV3('POST', url, timestamp, nonceStr, body, wechat.privateKey);

  const response = await fetch(`${WECHAT_API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${wechat.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${wechat.serialNo}",signature="${signature}"`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`微信退款失败: ${error.message || JSON.stringify(error)}`);
  }

  const result = await response.json();

  return {
    refundId: result.refund_id,
    status: result.status,
  };
}

// ============================================
// 支付宝
// ============================================

const ALIPAY_GATEWAY = 'https://openapi.alipay.com/gateway.do';
const ALIPAY_SANDBOX_GATEWAY = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do';

/**
 * 支付宝签名（RSA2）
 */
function signAlipay(params: Record<string, string>, privateKey: string): string {
  // 按key排序
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signStr, 'utf8');
  return sign.sign(privateKey, 'base64');
}

/**
 * 验证支付宝签名
 */
function verifyAlipaySign(
  params: Record<string, string>,
  sign: string,
  publicKey: string
): boolean {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '')
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(signStr, 'utf8');
  return verify.verify(publicKey, sign, 'base64');
}

/**
 * 创建支付宝订单（APP支付）
 */
export function createAlipayAppOrder(
  params: CreateOrderParams,
  config: PaymentConfig
): AlipayResult {
  const { alipay, env } = config;

  const bizContent = {
    out_trade_no: params.orderId,
    total_amount: (params.amount / 100).toFixed(2), // 转换为元
    subject: params.description,
    product_code: 'QUICK_MSECURITY_PAY',
  };

  const requestParams: Record<string, string> = {
    app_id: alipay.appId,
    method: 'alipay.trade.app.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    notify_url: alipay.notifyUrl,
    biz_content: JSON.stringify(bizContent),
  };

  // 签名
  const sign = signAlipay(requestParams, alipay.privateKey);
  requestParams.sign = sign;

  // 生成订单字符串
  const orderString = Object.keys(requestParams)
    .map(key => `${key}=${encodeURIComponent(requestParams[key])}`)
    .join('&');

  return {
    orderString,
  };
}

/**
 * 创建支付宝订单（网页支付）
 */
export function createAlipayWebOrder(
  params: CreateOrderParams,
  config: PaymentConfig
): AlipayResult {
  const { alipay, env } = config;
  const gateway = env === 'sandbox' ? ALIPAY_SANDBOX_GATEWAY : ALIPAY_GATEWAY;

  const bizContent = {
    out_trade_no: params.orderId,
    total_amount: (params.amount / 100).toFixed(2),
    subject: params.description,
    product_code: 'FAST_INSTANT_TRADE_PAY',
  };

  const requestParams: Record<string, string> = {
    app_id: alipay.appId,
    method: 'alipay.trade.page.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    notify_url: alipay.notifyUrl,
    return_url: alipay.returnUrl,
    biz_content: JSON.stringify(bizContent),
  };

  const sign = signAlipay(requestParams, alipay.privateKey);
  requestParams.sign = sign;

  const queryString = Object.keys(requestParams)
    .map(key => `${key}=${encodeURIComponent(requestParams[key])}`)
    .join('&');

  return {
    payUrl: `${gateway}?${queryString}`,
  };
}

/**
 * 解析支付宝回调
 */
export function parseAlipayNotification(
  params: Record<string, string>,
  config: PaymentConfig
): PaymentNotification | null {
  const { alipay } = config;

  // 验证签名
  const sign = params.sign;
  const isValid = verifyAlipaySign(params, sign, alipay.alipayPublicKey);

  if (!isValid) {
    console.error('支付宝回调签名验证失败');
    return null;
  }

  // 验证交易状态
  if (params.trade_status !== 'TRADE_SUCCESS' && params.trade_status !== 'TRADE_FINISHED') {
    return null;
  }

  return {
    orderId: params.out_trade_no,
    transactionId: params.trade_no,
    amount: Math.round(parseFloat(params.total_amount) * 100), // 转换为分
    paidAt: new Date(params.gmt_payment),
    raw: params,
  };
}

/**
 * 支付宝退款
 */
export async function refundAlipay(
  params: RefundParams,
  transactionId: string,
  config: PaymentConfig
): Promise<{ refundId: string; status: string }> {
  const { alipay, env } = config;
  const gateway = env === 'sandbox' ? ALIPAY_SANDBOX_GATEWAY : ALIPAY_GATEWAY;

  const bizContent = {
    trade_no: transactionId,
    out_request_no: params.refundId,
    refund_amount: (params.refundAmount / 100).toFixed(2),
    refund_reason: params.reason || '用户申请退款',
  };

  const requestParams: Record<string, string> = {
    app_id: alipay.appId,
    method: 'alipay.trade.refund',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    biz_content: JSON.stringify(bizContent),
  };

  const sign = signAlipay(requestParams, alipay.privateKey);
  requestParams.sign = sign;

  const response = await fetch(gateway, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: Object.keys(requestParams)
      .map(key => `${key}=${encodeURIComponent(requestParams[key])}`)
      .join('&'),
  });

  const result = await response.json();

  if (result.alipay_trade_refund_response.code !== '10000') {
    throw new Error(`支付宝退款失败: ${result.alipay_trade_refund_response.sub_msg}`);
  }

  return {
    refundId: params.refundId,
    status: 'SUCCESS',
  };
}

// ============================================
// 通用支付服务
// ============================================

export type PaymentMethod = 'wechat' | 'alipay' | 'mock';

export interface UnifiedPayResult {
  method: PaymentMethod;
  wechat?: WechatPayResult;
  alipay?: AlipayResult;
}

/**
 * 统一下单接口
 */
export async function createPayment(
  method: PaymentMethod,
  params: CreateOrderParams,
  payType: 'app' | 'native' | 'web' = 'app'
): Promise<UnifiedPayResult> {
  const config = getPaymentConfig();

  if (method === 'wechat') {
    let result: WechatPayResult;
    if (payType === 'native') {
      result = await createWechatNativeOrder(params, config);
    } else {
      result = await createWechatPayOrder(params, config);
    }
    return { method, wechat: result };
  }

  if (method === 'alipay') {
    let result: AlipayResult;
    if (payType === 'web') {
      result = createAlipayWebOrder(params, config);
    } else {
      result = createAlipayAppOrder(params, config);
    }
    return { method, alipay: result };
  }

  throw new Error(`不支持的支付方式: ${method}`);
}

/**
 * 统一退款接口
 */
export async function createRefund(
  method: PaymentMethod,
  params: RefundParams,
  transactionId: string
): Promise<{ refundId: string; status: string }> {
  const config = getPaymentConfig();

  if (method === 'wechat') {
    return refundWechatPay(params, transactionId, config);
  }

  if (method === 'alipay') {
    return refundAlipay(params, transactionId, config);
  }

  throw new Error(`不支持的支付方式退款: ${method}`);
}
