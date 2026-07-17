import type { Group } from '../types';
import { generateUniquePasswords } from './password';

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `grp_${Date.now().toString(36)}_${idCounter}`;
}

export type ParsedGroup = { members: string[]; account: string };

/**
 * 解析分組名單：每行一組，格式 `name1,name2,name3,[teamname]`（也接受 Tab 分隔）。
 * - 前 3 欄為姓名，空欄略過（允許不足 3 人）。
 * - 第 4 欄為組名(teamname)，留空者自動命名「第N組」（N 為組序號，避開已用組名）。
 * - 完全空白（無任何姓名）的行忽略。
 */
export function parseGroups(text: string): ParsedGroup[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const raw = lines.map((line) => {
    const parts = line.split(/[,\t]/).map((p) => p.trim());
    const members = parts.slice(0, 3).filter((p) => p.length > 0);
    const account = (parts[3] ?? '').trim();
    return { members, account };
  });

  // 略過完全沒有姓名的行
  const rows = raw.filter((r) => r.members.length > 0);

  // 自動補組名：空白者給「第N組」，避開已用組名
  const usedAccounts = new Set(
    rows.map((r) => r.account).filter((a) => a.length > 0),
  );
  let groupNo = 0;
  return rows.map((r) => {
    if (r.account) return r;
    let acc = '';
    do {
      groupNo += 1;
      acc = `第${groupNo}組`;
    } while (usedAccounts.has(acc));
    usedAccounts.add(acc);
    return { ...r, account: acc };
  });
}

/** 由解析結果建立組（每組附一個互異密碼，三人共用） */
export function buildGroups(rows: ParsedGroup[]): Group[] {
  const passwords = generateUniquePasswords(rows.length);
  return rows.map((r, i) => ({
    id: newId(),
    members: r.members,
    account: r.account,
    password: passwords[i],
  }));
}

/** 組員姓名串（以「・」分隔），供密碼紙／座位圖顯示 */
export function membersText(group: Group): string {
  return group.members.join('・');
}
