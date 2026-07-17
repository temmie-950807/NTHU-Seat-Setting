import type { RoomId } from '../types';
import {
  type RoomLayout,
  colsOf,
  rowsOf,
  colBoundaries,
  rowBoundaries,
  seatKey,
  ALL_ROOMS,
} from './roomLayouts';

/**
 * 分組模式專屬版面（與個人模式不同）：座位欄一律重新編號 1..N。
 * direction 決定「一組三人」怎麼連座：
 *  - horizontal：同一排、連續 groupSize 欄為一組（左區、右區各一組）
 *  - vertical  ：同一欄、連續 groupSize 排為一組（由前排→後排）
 */
export type GroupLayout = RoomLayout & {
  direction: 'horizontal' | 'vertical';
  groupSize: number;
  /** 左右兩組之間有一張沒用到的桌子（僅 horizontal 教室），座位圖需畫出但不分配 */
  gapDesk?: boolean;
};

export const GROUP_ROOM_LAYOUTS: Record<RoomId, GroupLayout> = {
  '323': {
    id: '323',
    name: '323 教室',
    colGroups: [2, 2], // 4 欄，走道在 C2 後
    rowGroups: [12], // 12 排連續
    direction: 'vertical', // 同欄連續 3 排一組
    groupSize: 3,
  },
  '326': {
    id: '326',
    name: '326 教室',
    colGroups: [3, 3], // 6 欄，走道在 C3 後（左 C1–3、右 C4–6）
    rowGroups: [8], // 8 排連續
    direction: 'horizontal', // 同排每 3 欄一組
    groupSize: 3,
  },
  '328': {
    id: '328',
    name: '328 教室',
    colGroups: [3, 3], // 每排兩組各 3 座（左右）
    rowGroups: [7], // 7 排連續
    direction: 'horizontal',
    groupSize: 3,
    gapDesk: true, // 左右組之間有一張沒用到的桌子
  },
};

/** 一個組槽：三連座（有序，對應顯示 members[0..2]）＋錨座位＋座位範圍描述 */
export type GroupSlot = {
  room: RoomId;
  anchorKey: string; // 組槽識別（＝最靠講台/最左的座位 key）
  seatKeys: string[]; // 有序：直向前→後、橫向左→右
  label: string; // 座位範圍，如 "R1 C1–C3" / "C1 R1–R3"
  /** 排序鍵：最靠講台的座位 row / col（用於前排優先分配） */
  sortRow: number;
  sortCol: number;
};

/** 產生某教室的全部組槽（分組版面、有序、靠講台優先） */
export function groupSlotsForRoom(room: RoomId): GroupSlot[] {
  const layout = GROUP_ROOM_LAYOUTS[room];
  const rows = rowsOf(layout);
  const cols = colsOf(layout);
  const n = layout.groupSize;
  const slots: GroupSlot[] = [];

  if (layout.direction === 'horizontal') {
    // 同一排、每個 colGroup（連續 n 欄）為一組
    for (let row = 1; row <= rows; row++) {
      let c = 1;
      for (const g of layout.colGroups) {
        // colGroup 大小應等於 groupSize；保險起見以 n 為步進
        for (let start = c; start + n - 1 <= c + g - 1; start += n) {
          const seatKeys: string[] = [];
          for (let k = 0; k < n; k++) seatKeys.push(seatKey(room, row, start + k));
          slots.push({
            room,
            anchorKey: seatKey(room, row, start),
            seatKeys,
            label: `R${row} C${start}–C${start + n - 1}`,
            sortRow: row,
            sortCol: start,
          });
        }
        c += g;
      }
    }
  } else {
    // 同一欄、每連續 n 排為一組（前排優先）
    for (let col = 1; col <= cols; col++) {
      for (let start = 1; start + n - 1 <= rows; start += n) {
        const seatKeys: string[] = [];
        for (let k = 0; k < n; k++) seatKeys.push(seatKey(room, start + k, col));
        slots.push({
          room,
          anchorKey: seatKey(room, start, col),
          seatKeys,
          label: `C${col} R${start}–R${start + n - 1}`,
          sortRow: start,
          sortCol: col,
        });
      }
    }
  }
  return slots;
}

/** 某教室組數 */
export function groupCapacityOf(room: RoomId): number {
  return groupSlotsForRoom(room).length;
}

/**
 * 以「組」為單位的相對位置佈局，供座位圖與密碼紙共用（維持組在教室的相對位置）。
 * - horizontal（326/328）：outer＝排（前→後），inner＝該排的組（左→右）
 * - vertical（323）：outer＝欄（左→右），inner＝該欄的組（前→後）
 * innerAisleAfter / outerAisleAfter：該 index 之後是否有走道（0-based）。
 */
export type GroupGrid = {
  direction: 'horizontal' | 'vertical';
  lines: GroupSlot[][];
  innerAisleAfter: Set<number>;
  outerAisleAfter: Set<number>;
};

export function groupGridForRoom(room: RoomId): GroupGrid {
  const layout = GROUP_ROOM_LAYOUTS[room];
  const slots = groupSlotsForRoom(room);
  const rows = rowsOf(layout);
  const cols = colsOf(layout);
  const lines: GroupSlot[][] = [];
  const innerAisleAfter = new Set<number>();
  const outerAisleAfter = new Set<number>();

  if (layout.direction === 'horizontal') {
    const perLine = layout.colGroups.length; // 每排組數
    for (let r = 0; r < rows; r++) {
      lines.push(slots.slice(r * perLine, (r + 1) * perLine));
    }
    // 每組之後（除最後一組）皆為走道
    for (let i = 0; i < perLine - 1; i++) innerAisleAfter.add(i);
    // 排之間依 rowBoundaries
    const rowB = rowBoundaries(layout);
    for (let r = 0; r < rows - 1; r++) if (rowB.has(r + 2)) outerAisleAfter.add(r);
  } else {
    const perCol = rows / layout.groupSize; // 每欄組數
    for (let c = 0; c < cols; c++) {
      lines.push(slots.slice(c * perCol, (c + 1) * perCol));
    }
    // 欄內組間無走道；欄之間依 colBoundaries
    const colB = colBoundaries(layout);
    for (let c = 0; c < cols - 1; c++) if (colB.has(c + 2)) outerAisleAfter.add(c);
  }

  return { direction: layout.direction, lines, innerAisleAfter, outerAisleAfter };
}

/** 全部啟用組槽的錨座位集合（供持久化校準） */
export function allGroupAnchorKeys(): Set<string> {
  const set = new Set<string>();
  for (const room of ALL_ROOMS) {
    for (const slot of groupSlotsForRoom(room)) set.add(slot.anchorKey);
  }
  return set;
}
