// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const algorithm = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY 未设置，敏感信息加密功能将不可用');
}

/**
 * 加密敏感字段（如手机号、邮箱、身份证等）
 * @param text 要加密的文本
 * @returns 加密后的字符串，格式：iv:authTag:encryptedText
 */
export function encryptField(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY 未配置，无法加密');
  }

  if (!text) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('加密失败');
  }
}

/**
 * 解密敏感字段
 * @param encryptedText 加密后的字符串，格式：iv:authTag:encryptedText
 * @returns 解密后的原文
 */
export function decryptField(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY 未配置，无法解密');
  }

  if (!encryptedText) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // 如果格式不对，可能是旧数据（未加密），直接返回
      return encryptedText;
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    // 如果解密失败，可能是旧数据，返回原文
    return encryptedText;
  }
}

/**
 * 哈希敏感信息用于查询（单向哈希，用于索引和查找）
 * 适用于需要查询但不需要解密的场景
 * @param text 要哈希的文本
 * @returns SHA-256 哈希值
 */
export function hashForQuery(text: string): string {
  if (!text) {
    return text;
  }
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * 掩码显示敏感信息（用于前端显示）
 * @param text 原文
 * @param type 类型：email | phone | idcard
 * @returns 掩码后的字符串
 */
export function maskSensitiveData(text: string, type: 'email' | 'phone' | 'idcard'): string {
  if (!text) {
    return text;
  }

  switch (type) {
    case 'email':
      // user@example.com -> u***r@example.com
      const [localPart, domain] = text.split('@');
      if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
      }
      return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;

    case 'phone':
      // 13800138000 -> 138****8000
      if (text.length < 7) {
        return text;
      }
      return `${text.slice(0, 3)}****${text.slice(-4)}`;

    case 'idcard':
      // 身份证号掩码：显示前6位和后4位
      if (text.length < 10) {
        return text;
      }
      return `${text.slice(0, 6)}****${text.slice(-4)}`;

    default:
      return text;
  }
}

/**
 * 验证加密环境是否配置正确
 */
export function validateEncryptionSetup(): boolean {
  return !!ENCRYPTION_KEY && ENCRYPTION_KEY.length >= 32;
}
