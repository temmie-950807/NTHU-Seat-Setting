import type { AppState, Seat } from '../types';
import { makeAllSeats, keyOfSeat, ALL_ROOMS } from '../data/roomLayouts';
import { allGroupAnchorKeys } from '../data/groupLayouts';

const STORAGE_KEY = 'exam-seat-state-v1';

export function defaultState(): AppState {
  return {
    mode: 'individual',
    students: [],
    enabledRooms: [...ALL_ROOMS],
    seats: makeAllSeats(),
    seed: 1,
    groups: [],
    groupSeed: 1,
    slotAssign: {},
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return mergeState(parsed);
  } catch {
    return defaultState();
  }
}

/**
 * 以目前版面為準校準座位：補齊新增排/座、丟棄版面外的舊座，
 * 並保留既有座位的 disabled / studentId。
 */
function reconcileSeats(old: Seat[]): Seat[] {
  const oldByKey = new Map(old.map((s) => [keyOfSeat(s), s] as const));
  return makeAllSeats().map((s) => {
    const prev = oldByKey.get(keyOfSeat(s));
    return prev
      ? { ...s, disabled: prev.disabled, studentId: prev.studentId }
      : s;
  });
}

/** 校準分組指派：丟棄錨座位已不存在於現行組槽的項目 */
function reconcileSlotAssign(
  old: Record<string, string> | undefined,
): Record<string, string> {
  if (!old) return {};
  const valid = allGroupAnchorKeys();
  const out: Record<string, string> = {};
  for (const [anchor, gid] of Object.entries(old)) {
    if (valid.has(anchor)) out[anchor] = gid;
  }
  return out;
}

/** 與預設合併，容忍舊資料缺欄位 */
function mergeState(partial: Partial<AppState>): AppState {
  const base = defaultState();
  return {
    mode: partial.mode === 'group' ? 'group' : 'individual',
    students: partial.students ?? base.students,
    enabledRooms:
      partial.enabledRooms && partial.enabledRooms.length
        ? partial.enabledRooms
        : base.enabledRooms,
    seats: reconcileSeats(partial.seats ?? []),
    seed: partial.seed ?? base.seed,
    groups: partial.groups ?? base.groups,
    groupSeed: partial.groupSeed ?? base.groupSeed,
    slotAssign: reconcileSlotAssign(partial.slotAssign),
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 忽略容量/隱私模式錯誤
  }
}

export function exportStateJson(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, 'exam-seat-backup.json');
}

export function parseStateJson(text: string): AppState {
  const parsed = JSON.parse(text) as Partial<AppState>;
  return mergeState(parsed);
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
