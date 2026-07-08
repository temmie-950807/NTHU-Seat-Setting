// 安全字集：排除易混淆字元 0 O o 1 l I i（去除數字 0/1 與大小寫 O/o、I/i、L 的小寫 l）。
// 保留其餘英數。
const SAFE_CHARS =
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

export const PASSWORD_LENGTH = 10;

/** 產生一組 10 碼安全密碼 */
export function generatePassword(length: number = PASSWORD_LENGTH): string {
  const out: string[] = [];
  const max = SAFE_CHARS.length;
  // 使用 rejection sampling 避免取樣偏差
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    const v = buf[0];
    if (v >= limit) continue;
    out.push(SAFE_CHARS[v % max]);
  }
  return out.join('');
}

/**
 * 產生 count 組互異密碼。
 * @param existing 既有需避開的密碼集合
 */
export function generateUniquePasswords(
  count: number,
  existing: Set<string> = new Set(),
): string[] {
  const used = new Set(existing);
  const result: string[] = [];
  while (result.length < count) {
    const pw = generatePassword();
    if (used.has(pw)) continue;
    used.add(pw);
    result.push(pw);
  }
  return result;
}
