import type { RoomId, Seat, Student } from '../types';
import {
  ROOM_LAYOUTS,
  colsOf,
  rowsOf,
  colBoundaries,
  rowBoundaries,
} from '../data/roomLayouts';
import { seatKeyOf } from '../lib/assign';

type Props = {
  enabledRooms: RoomId[];
  seats: Seat[];
  studentsById: Map<string, Student>;
};

function RoomSlips({
  room,
  seats,
  studentsById,
}: {
  room: RoomId;
  seats: Seat[];
  studentsById: Map<string, Student>;
}) {
  const layout = ROOM_LAYOUTS[room];
  const rows = rowsOf(layout);
  const cols = colsOf(layout);
  const colB = colBoundaries(layout);
  const rowB = rowBoundaries(layout);
  const byKey = new Map(seats.map((s) => [seatKeyOf(s), s] as const));

  return (
    <section className="slips-page">
      <h3 className="slips-title">
        {layout.name}　密碼紙（建議橫向列印；沿虛線裁切、粗線為走道分隔）
      </h3>
      <div
        className="slips-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: rows }, (_, ri) => {
          const row = ri + 1;
          return Array.from({ length: cols }, (_, ci) => {
            const col = ci + 1;
            const seat = byKey.get(`${room}-${row}-${col}`);
            const student =
              seat && seat.studentId
                ? studentsById.get(seat.studentId) ?? null
                : null;
            const cls = ['slip-cell'];
            if (colB.has(col)) cls.push('grp-left');
            if (rowB.has(row)) cls.push('grp-top');
            if (!student) cls.push('slip-empty');
            return (
              <div key={`${row}-${col}`} className={cls.join(' ')}>
                {student ? (
                  <>
                    <div className="slip-row">
                      <span className="slip-label">姓名</span>
                      <span className="slip-val">
                        {student.name || '(無姓名)'}
                      </span>
                    </div>
                    <div className="slip-row">
                      <span className="slip-label">帳號</span>
                      <span className="slip-val mono">{student.account}</span>
                    </div>
                    <div className="slip-row">
                      <span className="slip-label">密碼</span>
                      <span className="slip-val mono">{student.password}</span>
                    </div>
                  </>
                ) : (
                  <div className="slip-blank" aria-hidden />
                )}
              </div>
            );
          });
        })}
      </div>
    </section>
  );
}

export default function PasswordSlips({
  enabledRooms,
  seats,
  studentsById,
}: Props) {
  if (enabledRooms.length === 0) {
    return <p className="empty">尚未啟用任何教室。</p>;
  }
  return (
    <div className="slips">
      {enabledRooms.map((room) => (
        <RoomSlips
          key={room}
          room={room}
          seats={seats}
          studentsById={studentsById}
        />
      ))}
    </div>
  );
}
