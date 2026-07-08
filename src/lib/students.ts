import type { Student } from '../types';
import { generateUniquePasswords } from './password';

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `stu_${Date.now().toString(36)}_${idCounter}`;
}

export type ParsedRow = { name: string; account: string };

/**
 * 解析名單文字：每行一位學生，格式 `姓名,帳號`（也接受 Tab 分隔）。
 * - 只有一欄時視為「姓名」，帳號留空待自動補 teamNN。
 * - 帳號留空者，依整體序號補 team01、team02…（兩位數，超過 99 則自然進位）。
 * 空行忽略。
 */
export function parseRoster(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: ParsedRow[] = lines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const name = parts[0] ?? '';
    const account = (parts[1] ?? '').trim();
    return { name, account };
  });

  // 自動補帳號
  let teamNo = 0;
  const usedAccounts = new Set(
    rows.map((r) => r.account).filter((a) => a.length > 0),
  );
  return rows.map((r) => {
    if (r.account) return r;
    // 找下一個未被占用的 teamNN
    let acc = '';
    do {
      teamNo += 1;
      acc = `team${String(teamNo).padStart(2, '0')}`;
    } while (usedAccounts.has(acc));
    usedAccounts.add(acc);
    return { ...r, account: acc };
  });
}

/** 由解析結果建立學生（附唯一密碼） */
export function buildStudents(rows: ParsedRow[]): Student[] {
  const passwords = generateUniquePasswords(rows.length);
  return rows.map((r, i) => ({
    id: newId(),
    name: r.name,
    account: r.account,
    password: passwords[i],
  }));
}

/** 座位上顯示用的識別：優先真實姓名，缺姓名退回帳號 */
export function displayName(student: Student): string {
  return student.name?.trim() ? student.name.trim() : student.account;
}
