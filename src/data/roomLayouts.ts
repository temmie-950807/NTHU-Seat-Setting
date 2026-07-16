import type { RoomId, Seat } from '../types';

export type RoomLayout = {
  id: RoomId;
  name: string;
  /** 每個欄群組的座位數，左→右。加總 = 每排總座位數 */
  colGroups: number[];
  /** 每個排群組的排數，前→後（前＝近投影幕）。加總 = 總排數 */
  rowGroups: number[];
};

export const ROOM_LAYOUTS: Record<RoomId, RoomLayout> = {
  '323': {
    id: '323',
    name: '323 教室',
    colGroups: [2, 2], // 2 ｜走道｜2（每排 4 個座位）
    rowGroups: [12], // 12 排連續，排間無間距
  },
  '326': {
    id: '326',
    name: '326 教室',
    colGroups: [3, 4], // 左 3 ｜走道｜右 4
    rowGroups: [1, 2, 2, 2, 1], // 排群組間距 1 / 2 / 2 / 2 / 1（共 8 排）
  },
  '328': {
    id: '328',
    name: '328 教室',
    colGroups: [2, 2, 3], // 2 ｜走道｜2 ｜走道｜3
    rowGroups: [7], // 排與排之間無間距（共 7 排）
  },
};

export const ALL_ROOMS: RoomId[] = ['323', '326', '328'];

export function colsOf(layout: RoomLayout): number {
  return layout.colGroups.reduce((a, b) => a + b, 0);
}

export function rowsOf(layout: RoomLayout): number {
  return layout.rowGroups.reduce((a, b) => a + b, 0);
}

export function capacityOf(layout: RoomLayout): number {
  return colsOf(layout) * rowsOf(layout);
}

/**
 * 回傳「群組邊界前一個索引」集合：若 1-based 索引 i 屬於此集合，
 * 代表在第 i 欄（或第 i 排）之前要插入走道／粗線。
 */
function groupStartBoundaries(groups: number[]): Set<number> {
  const set = new Set<number>();
  let acc = 0;
  for (let g = 0; g < groups.length - 1; g++) {
    acc += groups[g];
    set.add(acc + 1); // 下一群組的第一個索引
  }
  return set;
}

export function colBoundaries(layout: RoomLayout): Set<number> {
  return groupStartBoundaries(layout.colGroups);
}

export function rowBoundaries(layout: RoomLayout): Set<number> {
  return groupStartBoundaries(layout.rowGroups);
}

/** 產生某教室全部座位（未指派、未停用） */
export function makeSeatsForRoom(room: RoomId): Seat[] {
  const layout = ROOM_LAYOUTS[room];
  const rows = rowsOf(layout);
  const cols = colsOf(layout);
  const seats: Seat[] = [];
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      seats.push({ room, row, col, disabled: false, studentId: null });
    }
  }
  return seats;
}

/** 兩間全部座位 */
export function makeAllSeats(): Seat[] {
  return ALL_ROOMS.flatMap(makeSeatsForRoom);
}

export function seatKey(room: RoomId, row: number, col: number): string {
  return `${room}-${row}-${col}`;
}

export function keyOfSeat(seat: Seat): string {
  return seatKey(seat.room, seat.row, seat.col);
}
