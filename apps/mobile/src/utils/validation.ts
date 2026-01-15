/**
 * 表单验证工具函数
 */

/**
 * 验证手机号
 * @param phone 手机号
 * @returns 是否有效
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果 { isValid, message }
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password) {
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.length < 6) {
    return { isValid: false, message: '密码长度不能少于 6 位' };
  }

  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过 20 位' };
  }

  // 可选：要求包含数字和字母
  // const hasLetter = /[a-zA-Z]/.test(password);
  // const hasNumber = /\d/.test(password);
  // if (!hasLetter || !hasNumber) {
  //   return { isValid: false, message: '密码必须包含字母和数字' };
  // }

  return { isValid: true };
}

/**
 * 验证验证码
 * @param code 验证码
 * @returns 是否有效
 */
export function validateVerificationCode(code: string): boolean {
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
}

/**
 * 验证身份证号
 * @param idCard 身份证号
 * @returns 是否有效
 */
export function validateIdCard(idCard: string): boolean {
  // 简单验证：18 位数字或 17 位数字 + X
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return idCardRegex.test(idCard);
}

/**
 * 验证 URL
 * @param url URL 地址
 * @returns 是否有效
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证昵称
 * @param nickname 昵称
 * @returns 验证结果 { isValid, message }
 */
export function validateNickname(nickname: string): {
  isValid: boolean;
  message?: string;
} {
  if (!nickname || !nickname.trim()) {
    return { isValid: false, message: '昵称不能为空' };
  }

  if (nickname.length < 2) {
    return { isValid: false, message: '昵称长度不能少于 2 个字符' };
  }

  if (nickname.length > 20) {
    return { isValid: false, message: '昵称长度不能超过 20 个字符' };
  }

  // 禁止特殊字符（可选）
  const specialCharsRegex = /[<>\"'\\\/]/;
  if (specialCharsRegex.test(nickname)) {
    return { isValid: false, message: '昵称不能包含特殊字符' };
  }

  return { isValid: true };
}

/**
 * 验证钱包地址（以太坊）
 * @param address 钱包地址
 * @returns 是否有效
 */
export function validateWalletAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

/**
 * 验证数字范围
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 验证结果
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number
): { isValid: boolean; message?: string } {
  if (isNaN(value)) {
    return { isValid: false, message: '请输入有效的数字' };
  }

  if (value < min) {
    return { isValid: false, message: `数值不能小于 ${min}` };
  }

  if (value > max) {
    return { isValid: false, message: `数值不能大于 ${max}` };
  }

  return { isValid: true };
}

/**
 * 验证文本长度
 * @param text 文本
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 验证结果
 */
export function validateTextLength(
  text: string,
  minLength: number,
  maxLength: number
): { isValid: boolean; message?: string } {
  const length = text.trim().length;

  if (length < minLength) {
    return { isValid: false, message: `内容长度不能少于 ${minLength} 个字符` };
  }

  if (length > maxLength) {
    return { isValid: false, message: `内容长度不能超过 ${maxLength} 个字符` };
  }

  return { isValid: true };
}

// ============ 证件号验证 ============

import type { IdDocumentType, CreateAddressRequest } from '../services/personalInfo';

/**
 * 验证中国身份证号（完整校验）
 */
export function validateChinaIdFull(idNumber: string): { valid: boolean; error?: string } {
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

/**
 * 验证护照号
 */
export function validatePassport(idNumber: string): { valid: boolean; error?: string } {
  const chinaRegex = /^[EGeg]\d{8}$/;
  const internationalRegex = /^[A-Za-z0-9]{6,9}$/;

  if (!chinaRegex.test(idNumber) && !internationalRegex.test(idNumber)) {
    return { valid: false, error: '护照号格式不正确' };
  }

  return { valid: true };
}

/**
 * 验证港澳通行证号
 */
export function validateHkPermit(idNumber: string): { valid: boolean; error?: string } {
  const regex = /^[CWcw]\d{8}$/;

  if (!regex.test(idNumber)) {
    return { valid: false, error: '港澳通行证号格式不正确' };
  }

  return { valid: true };
}

/**
 * 验证台湾通行证号
 */
export function validateTwPermit(idNumber: string): { valid: boolean; error?: string } {
  const regex = /^[Tt]\d{8}$/;

  if (!regex.test(idNumber)) {
    return { valid: false, error: '台湾通行证号格式不正确' };
  }

  return { valid: true };
}

/**
 * 根据证件类型验证证件号
 */
export function validateIdNumberByType(idType: IdDocumentType, idNumber: string): { valid: boolean; error?: string } {
  if (!idNumber || !idNumber.trim()) {
    return { valid: false, error: '请输入证件号码' };
  }

  switch (idType) {
    case 'china_id':
      return validateChinaIdFull(idNumber);
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

// ============ 国际电话验证 ============

/**
 * 验证国际电话号码
 */
export function validateInternationalPhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,15}$/.test(phone);
}

/**
 * 验证电话号码（支持国际）
 */
export function validatePhoneByCountry(phone: string, country: string = '中国'): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, error: '请输入电话号码' };
  }

  const isValid = country === '中国'
    ? validatePhone(phone)
    : validateInternationalPhone(phone);

  if (!isValid) {
    return { valid: false, error: '请输入正确的电话号码' };
  }

  return { valid: true };
}

// ============ 地址验证 ============

/**
 * 验证地址信息
 */
export function validateAddress(address: Partial<CreateAddressRequest>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 收件人姓名
  if (!address.recipientName?.trim()) {
    errors.recipientName = '请输入收件人姓名';
  } else if (address.recipientName.length > 20) {
    errors.recipientName = '收件人姓名不能超过20个字符';
  }

  // 收件人电话
  if (!address.recipientPhone?.trim()) {
    errors.recipientPhone = '请输入收件人电话';
  } else {
    const phoneResult = validatePhoneByCountry(address.recipientPhone, address.country);
    if (!phoneResult.valid) {
      errors.recipientPhone = phoneResult.error!;
    }
  }

  // 省份
  if (!address.province?.trim()) {
    errors.province = '请选择省份';
  }

  // 城市
  if (!address.city?.trim()) {
    errors.city = '请选择城市';
  }

  // 区县
  if (!address.district?.trim()) {
    errors.district = '请选择区/县';
  }

  // 详细地址
  if (!address.addressDetail?.trim()) {
    errors.addressDetail = '请输入详细地址';
  } else if (address.addressDetail.length > 200) {
    errors.addressDetail = '详细地址不能超过200个字符';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============ 证件信息验证 ============

/**
 * 验证证件信息
 */
export function validateIdDocument(doc: {
  idType?: IdDocumentType;
  fullName?: string;
  idNumber?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 证件类型
  if (!doc.idType) {
    errors.idType = '请选择证件类型';
  }

  // 姓名
  if (!doc.fullName?.trim()) {
    errors.fullName = '请输入证件姓名';
  } else if (doc.fullName.length > 50) {
    errors.fullName = '姓名不能超过50个字符';
  }

  // 证件号码
  if (!doc.idNumber?.trim()) {
    errors.idNumber = '请输入证件号码';
  } else if (doc.idType) {
    const idResult = validateIdNumberByType(doc.idType, doc.idNumber);
    if (!idResult.valid) {
      errors.idNumber = idResult.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
