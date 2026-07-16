export type RoomId = '323' | '326' | '328';

export type Student = {
  id: string;
  name: string; // 真實姓名（可能為空，UI 退回顯示帳號）
  account: string; // 帳號或 teamNN
  password: string; // 10 碼英數
};

export type Seat = {
  room: RoomId;
  row: number; // 1-based，1 為最靠近投影幕（前排）
  col: number; // 1-based，由左至右
  disabled: boolean; // 助教手動停用
  studentId: string | null; // 佔用者
};

export type AppState = {
  students: Student[];
  enabledRooms: RoomId[];
  seats: Seat[]; // 兩間所有座位（含 disabled 狀態）
  seed: number; // 洗牌種子，供重現
};
