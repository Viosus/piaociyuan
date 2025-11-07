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
