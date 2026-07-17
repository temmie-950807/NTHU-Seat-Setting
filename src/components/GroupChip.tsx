import { useDraggable } from '@dnd-kit/core';
import type { Group } from '../types';
import { membersText } from '../lib/groups';

/** 可拖曳的「組」晶片：拖到組槽＝入座，拖回待安排＝退出 */
export default function GroupChip({ group }: { group: Group }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `grp:${group.id}`,
  });
  return (
    <button
      ref={setNodeRef}
      className="chip group-chip"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
      title={`${group.account}｜${membersText(group)}`}
    >
      <span className="chip-name">{group.account}</span>
      <span className="chip-sub">{membersText(group) || '(無成員)'}</span>
    </button>
  );
}
