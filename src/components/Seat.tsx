import { useDroppable } from '@dnd-kit/core';
import type { Seat as SeatType, Student } from '../types';
import { seatKeyOf } from '../lib/assign';
import StudentChip from './StudentChip';

type Props = {
  seat: SeatType;
  student: Student | null;
  editMode: boolean;
  onToggleDisabled: (key: string) => void;
};

export default function Seat({
  seat,
  student,
  editMode,
  onToggleDisabled,
}: Props) {
  const key = seatKeyOf(seat);
  const { setNodeRef, isOver } = useDroppable({
    id: `seat:${key}`,
    disabled: seat.disabled || editMode,
  });

  const classes = ['seat'];
  if (seat.disabled) classes.push('seat-disabled');
  if (isOver) classes.push('seat-over');
  if (editMode) classes.push('seat-editable');

  return (
    <div
      ref={setNodeRef}
      className={classes.join(' ')}
      onClick={editMode ? () => onToggleDisabled(key) : undefined}
      data-seat={key}
    >
      {seat.disabled ? (
        <span className="seat-x">停用</span>
      ) : student && !editMode ? (
        <StudentChip student={student} />
      ) : (
        <span className="seat-pos">{`R${seat.row}C${seat.col}`}</span>
      )}
    </div>
  );
}
