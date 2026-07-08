import { useDroppable } from '@dnd-kit/core';
import type { Student } from '../types';
import StudentChip from './StudentChip';

type Props = { students: Student[] };

/** 待安排區：尚未入座的學生，可拖入座位；也可把座位上的人拖回這裡 */
export default function Pool({ students }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });
  return (
    <div
      ref={setNodeRef}
      className={'pool no-print' + (isOver ? ' pool-over' : '')}
    >
      <div className="pool-title">
        待安排（{students.length}）
        <span className="pool-hint">— 可拖曳至座位，或把座位上的人拖回此處</span>
      </div>
      <div className="pool-chips">
        {students.length === 0 ? (
          <span className="pool-empty">全部已入座</span>
        ) : (
          students.map((s) => <StudentChip key={s.id} student={s} />)
        )}
      </div>
    </div>
  );
}
