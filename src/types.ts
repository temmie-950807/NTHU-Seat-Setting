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

/** 使用模式：個人考試 / 分組上機考 */
export type Mode = 'individual' | 'group';

/** 一組（三人一組、共用一台電腦）：一個帳號＋一個密碼，三人共用 */
export type Group = {
  id: string;
  members: string[]; // 1–3 個姓名（可少於 3）
  account: string; // 組名（teamname 或自動「第N組」），全體互異
  password: string; // 一組一個密碼
};

export type AppState = {
  mode: Mode; // 目前模式（預設 individual）
  students: Student[];
  enabledRooms: RoomId[];
  seats: Seat[]; // 兩間所有座位（含 disabled 狀態）
  seed: number; // 個人模式洗牌種子，供重現
  // 分組模式狀態（與個人模式並存、各自持久化）
  groups: Group[];
  groupSeed: number; // 分組模式洗牌種子
  slotAssign: Record<string, string>; // 組槽錨座位 key → groupId
};
