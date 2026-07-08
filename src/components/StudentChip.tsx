import { useDraggable } from '@dnd-kit/core';
import type { Student } from '../types';
import { displayName } from '../lib/students';

export default function StudentChip({ student }: { student: Student }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `stu:${student.id}`,
  });
  return (
    <button
      ref={setNodeRef}
      className="chip"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
      title={`${student.name || '(無姓名)'} / ${student.account}`}
    >
      <span className="chip-name">{displayName(student)}</span>
    </button>
  );
}
