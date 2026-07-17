import type { Student } from '../types';
import { triggerDownload } from './storage';

/** CSV 欄位跳脫：含逗號、引號、換行時以雙引號包住 */
function esc(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

/**
 * 匯出密碼 CSV（含 帳號,姓名,密碼 三欄，含 UTF-8 BOM 供 Excel 正確顯示中文）
 */
export function exportPasswordsCsv(
  students: Student[],
  filename = 'passwords.csv',
): void {
  const header = ['帳號', '姓名', '密碼'];
  const rows = students.map((s) => [esc(s.account), esc(s.name), esc(s.password)].join(','));
  const content = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename);
}

export type GroupCsvRow = {
  account: string;
  roomName: string; // 教室名（未安排則空）
  label: string; // 座位範圍（未安排則空）
  members: string[];
  password: string;
};

/** 匯出分組密碼 CSV（組名,教室,座位,組員1-3,密碼；含 UTF-8 BOM） */
export function exportGroupsCsv(
  rows: GroupCsvRow[],
  filename = 'groups.csv',
): void {
  const header = ['組名', '教室', '座位', '組員1', '組員2', '組員3', '密碼'];
  const lines = rows.map((r) =>
    [
      r.account,
      r.roomName,
      r.label,
      r.members[0] ?? '',
      r.members[1] ?? '',
      r.members[2] ?? '',
      r.password,
    ]
      .map(esc)
      .join(','),
  );
  const content = '﻿' + [header.join(','), ...lines].join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename);
}
