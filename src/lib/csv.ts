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
 * 匯出密碼 CSV（僅 帳號,密碼 兩欄，含 UTF-8 BOM 供 Excel 正確顯示中文）
 */
export function exportPasswordsCsv(
  students: Student[],
  filename = 'passwords.csv',
): void {
  const header = ['帳號', '密碼'];
  const rows = students.map((s) => [esc(s.account), esc(s.password)].join(','));
  const content = '﻿' + [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename);
}
