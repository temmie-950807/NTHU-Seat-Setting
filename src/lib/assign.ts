import type { Group, RoomId, Seat, Student } from '../types';
import { ALL_ROOMS } from '../data/roomLayouts';
import { groupSlotsForRoom, type GroupSlot } from '../data/groupLayouts';

/** mulberry32：以整數種子建立可重現 PRNG，回傳 [0,1) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 依種子做 Fisher–Yates 洗牌（不改動原陣列） */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const roomIndex = (room: RoomId) => ALL_ROOMS.indexOf(room);

/** 跨教室逐項交錯：queues 為各教室已排序序列，第 i 輪從每間各取第 i 個 */
function interleave<T>(queues: T[][]): T[] {
  const result: T[] = [];
  const maxLen = queues.reduce((m, q) => Math.max(m, q.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const q of queues) {
      if (i < q.length) result.push(q[i]);
    }
  }
  return result;
}

/**
 * 分配順序：僅取啟用教室、未停用的座位。
 * 每間教室各自依 排(前排先) → 欄(左→右) 排好，再「跨教室逐座輪流交錯」，
 * 使多間教室同時啟用時人數盡量平均（差距 ≤1，某間坐滿會自動溢位到其他間），
 * 且每間都優先坐前排。單間啟用時等同前排→左欄依序填。
 */
export function frontFirstSeats(seats: Seat[], enabledRooms: RoomId[]): Seat[] {
  const enabled = new Set(enabledRooms);
  // 依教室分組，僅收啟用且未停用的座位
  const byRoom = new Map<RoomId, Seat[]>();
  for (const s of seats) {
    if (!enabled.has(s.room) || s.disabled) continue;
    (byRoom.get(s.room) ?? byRoom.set(s.room, []).get(s.room)!).push(s);
  }
  // 每間內排序（前排→左欄）；教室間依 ALL_ROOMS 固定順序，確保可重現
  const queues = [...byRoom.keys()]
    .sort((a, b) => roomIndex(a) - roomIndex(b))
    .map((room) =>
      byRoom
        .get(room)!
        .slice()
        .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col)),
    );
  // 逐座輪流交錯：第 i 輪從每間各取第 i 個座位（該間還有的話）
  return interleave(queues);
}

export type AssignResult = {
  seats: Seat[]; // 全部座位（含未啟用/停用），已更新 studentId
  shortage: number; // 缺額（學生數 - 可用座位數，>0 表示座位不足）
  seatedCount: number;
};

/**
 * 隨機（依種子）將學生指派到「啟用且未停用」座位，前排優先。
 * 會清除所有座位的既有指派後重新排。
 */
export function assignSeats(
  students: Student[],
  seats: Seat[],
  enabledRooms: RoomId[],
  seed: number,
): AssignResult {
  const cleared = seats.map((s) => ({ ...s, studentId: null as string | null }));
  const order = frontFirstSeats(cleared, enabledRooms);
  const shuffled = seededShuffle(students, seed);

  const n = Math.min(shuffled.length, order.length);
  for (let i = 0; i < n; i++) {
    order[i].studentId = shuffled[i].id;
  }

  return {
    seats: cleared,
    shortage: Math.max(0, students.length - order.length),
    seatedCount: n,
  };
}

export const seatKeyOf = (s: Seat) => `${s.room}-${s.row}-${s.col}`;

/**
 * 拖拉調整（以學生為主體）：把 studentId 放到 toKey 座位；
 * toKey 為 null 代表移回「待安排」區。
 * - 目標已有人＝互換（原座位換成被擠掉的人；若來自待安排區則被擠掉者回待安排）。
 * - 目標為停用座位＝忽略。
 */
export function placeStudent(
  seats: Seat[],
  studentId: string,
  toKey: string | null,
): Seat[] {
  const from = seats.find((s) => s.studentId === studentId) ?? null;
  const fromKey = from ? seatKeyOf(from) : null;
  if (toKey === fromKey) return seats;

  const to = toKey ? seats.find((s) => seatKeyOf(s) === toKey) : null;
  if (toKey && (!to || to.disabled)) return seats; // 無效目標

  const displaced = to?.studentId ?? null;
  return seats.map((s) => {
    const k = seatKeyOf(s);
    if (k === toKey) return { ...s, studentId };
    if (k === fromKey) return { ...s, studentId: displaced };
    return s;
  });
}

/** 切換座位停用；停用已佔座位時，佔用者退回待安排區 */
export function toggleSeatDisabled(seats: Seat[], key: string): Seat[] {
  return seats.map((s) => {
    if (seatKeyOf(s) !== key) return s;
    const disabled = !s.disabled;
    return { ...s, disabled, studentId: disabled ? null : s.studentId };
  });
}

/** 尚未入座的學生 id 集合 */
export function unseatedStudentIds(
  students: Student[],
  seats: Seat[],
): string[] {
  const seated = new Set(
    seats.map((s) => s.studentId).filter((x): x is string => !!x),
  );
  return students.filter((s) => !seated.has(s.id)).map((s) => s.id);
}

// ===== 分組模式 =====

export type GroupAssignResult = {
  slotAssign: Record<string, string>; // 組槽錨 key → groupId
  shortage: number; // 缺額（組數 - 可用組槽數，>0 表示組槽不足）
  assignedCount: number;
};

/**
 * 分組分配順序：各啟用教室的組槽依「靠講台（前排）優先」排序後跨教室交錯，
 * 使多間教室同時啟用時組數盡量平均，且每間都優先坐靠講台的前排。
 */
export function frontFirstSlots(enabledRooms: RoomId[]): GroupSlot[] {
  const rooms = [...new Set(enabledRooms)].sort(
    (a, b) => roomIndex(a) - roomIndex(b),
  );
  const queues = rooms.map((room) =>
    groupSlotsForRoom(room)
      .slice()
      .sort((a, b) =>
        a.sortRow !== b.sortRow ? a.sortRow - b.sortRow : a.sortCol - b.sortCol,
      ),
  );
  return interleave(queues);
}

/** 依種子把組隨機分配到組槽（可重現；靠講台前排優先、跨教室平均） */
export function assignGroups(
  groups: Group[],
  enabledRooms: RoomId[],
  seed: number,
): GroupAssignResult {
  const order = frontFirstSlots(enabledRooms);
  const shuffled = seededShuffle(groups, seed);
  const n = Math.min(shuffled.length, order.length);
  const slotAssign: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    slotAssign[order[i].anchorKey] = shuffled[i].id;
  }
  return {
    slotAssign,
    shortage: Math.max(0, groups.length - order.length),
    assignedCount: n,
  };
}

/**
 * 分組模式手動調整：把某組移到 toAnchor 組槽（放置／互換）；
 * toAnchor 為 null＝退回「待安排」區。
 * - 目標組槽已有組＝互換（來源在座則交換；來源為待安排則原組被擠回待安排）。
 */
export function placeGroup(
  slotAssign: Record<string, string>,
  groupId: string,
  toAnchor: string | null,
): Record<string, string> {
  let fromAnchor: string | null = null;
  for (const [anchor, gid] of Object.entries(slotAssign)) {
    if (gid === groupId) {
      fromAnchor = anchor;
      break;
    }
  }
  if (toAnchor === fromAnchor) return slotAssign;

  const next = { ...slotAssign };
  if (toAnchor === null) {
    if (fromAnchor) delete next[fromAnchor];
    return next;
  }
  const displaced = next[toAnchor] ?? null;
  next[toAnchor] = groupId;
  if (fromAnchor) {
    if (displaced) next[fromAnchor] = displaced;
    else delete next[fromAnchor];
  }
  // fromAnchor 為 null（來自待安排）時，displaced 自動退回待安排，無需處理
  return next;
}

/** 尚未分配到組槽的組 id */
export function unassignedGroupIds(
  groups: Group[],
  slotAssign: Record<string, string>,
): string[] {
  const assigned = new Set(Object.values(slotAssign));
  return groups.filter((g) => !assigned.has(g.id)).map((g) => g.id);
}
