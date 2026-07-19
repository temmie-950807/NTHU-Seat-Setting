import type { RoomId, Seat as SeatType, Student } from '../types';
import {
  ROOM_LAYOUTS,
  colsOf,
  rowsOf,
  colBoundaries,
  rowBoundaries,
} from '../data/roomLayouts';
import { seatKeyOf } from '../lib/assign';
import Seat from './Seat';

type Props = {
  room: RoomId;
  seats: SeatType[]; // 全部座位，內部過濾
  studentsById: Map<string, Student>;
  editMode: boolean;
  onToggleDisabled: (key: string) => void;
};

export default function SeatMap({
  room,
  seats,
  studentsById,
  editMode,
  onToggleDisabled,
}: Props) {
  const layout = ROOM_LAYOUTS[room];
  const rows = rowsOf(layout);
  const cols = colsOf(layout);
  const colB = colBoundaries(layout);
  const rowB = rowBoundaries(layout);

  const byKey = new Map(seats.map((s) => [seatKeyOf(s), s] as const));

  return (
    <section className={`room room-${room}`}>
      <h2 className="room-name">{layout.name}</h2>
      <div className="screen">[ 投影幕 ]</div>
      <div className="room-grid">
        {Array.from({ length: rows }, (_, ri) => {
          const row = ri + 1;
          return (
            <div key={row} className="row-wrap">
              {rowB.has(row) && <div className="aisle-row" aria-hidden />}
              <div className="seat-row">
                {Array.from({ length: cols }, (_, ci) => {
                  const col = ci + 1;
                  const seat = byKey.get(`${room}-${row}-${col}`)!;
                  const student = seat.studentId
                    ? studentsById.get(seat.studentId) ?? null
                    : null;
                  return (
                    <div key={col} className="cell-wrap">
                      {colB.has(col) && <div className="aisle-col" aria-hidden />}
                      <Seat
                        seat={seat}
                        student={student}
                        editMode={editMode}
                        onToggleDisabled={onToggleDisabled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
