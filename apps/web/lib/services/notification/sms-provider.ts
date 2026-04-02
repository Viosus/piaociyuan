// lib/services/notification/sms-provider.ts
import type { SmsProvider, SmsProviderType, SendSmsParams, SendSmsResult } from './types';

/**
 * Mock 短信服务（开发环境使用）
 */
class MockSmsProvider implements SmsProvider {
  async send(params: SendSmsParams): Promise<SendSmsResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 短信（Mock 模式）', `手机号: ${params.phone}`);
    }
    return { success: true, messageId: 'mock-sms-id' };
  }
}

/**
 * 阿里云短信服务（预留）
 *
 * 需要安装依赖: npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client
 *
 * 环境变量:
 * - ALIYUN_SMS_ACCESS_KEY_ID
 * - ALIYUN_SMS_ACCESS_KEY_SECRET
 * - ALIYUN_SMS_SIGN_NAME
 */
class AliyunSmsProvider implements SmsProvider {
  async send(params: SendSmsParams): Promise<SendSmsResult> {
    // TODO: 实现阿里云短信发送
    // 参考文档: https://help.aliyun.com/document_detail/101414.html
    console.warn('阿里云短信服务尚未实现，回退到 Mock 模式');
    return { success: true, messageId: 'aliyun-mock-id' };
  }
}

/**
 * 腾讯云短信服务（预留）
 *
 * 需要安装依赖: npm install tencentcloud-sdk-nodejs-sms
 *
 * 环境变量:
 * - TENCENT_SMS_SECRET_ID
 * - TENCENT_SMS_SECRET_KEY
 * - TENCENT_SMS_SDK_APP_ID
 */
class TencentSmsProvider implements SmsProvider {
  async send(params: SendSmsParams): Promise<SendSmsResult> {
    // TODO: 实现腾讯云短信发送
    // 参考文档: https://cloud.tencent.com/document/product/382/43197
    console.warn('腾讯云短信服务尚未实现，回退到 Mock 模式');
    return { success: true, messageId: 'tencent-mock-id' };
  }
}

// 短信服务实例缓存
const smsProviders: Partial<Record<SmsProviderType, SmsProvider>> = {};

/**
 * 获取短信服务实例
 */
export function getSmsProvider(type?: SmsProviderType): SmsProvider {
  const providerType = type || (process.env.SMS_PROVIDER as SmsProviderType) || 'mock';

  if (!smsProviders[providerType]) {
    switch (providerType) {
      case 'aliyun':
        smsProviders[providerType] = new AliyunSmsProvider();
        break;
      case 'tencent':
        smsProviders[providerType] = new TencentSmsProvider();
        break;
      case 'mock':
      default:
        smsProviders[providerType] = new MockSmsProvider();
        break;
    }
  }

  return smsProviders[providerType]!;
}

/**
 * 发送短信验证码
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const provider = getSmsProvider();
  return provider.send(params);
}
