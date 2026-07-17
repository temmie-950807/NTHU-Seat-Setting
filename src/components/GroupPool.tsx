import { useDroppable } from '@dnd-kit/core';
import type { Group } from '../types';
import GroupChip from './GroupChip';

type Props = { groups: Group[] };

/** 待安排區（分組）：尚未入座的組，可拖入組槽；也可把組槽上的組拖回這裡 */
export default function GroupPool({ groups }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });
  return (
    <div
      ref={setNodeRef}
      className={'pool no-print' + (isOver ? ' pool-over' : '')}
    >
      <div className="pool-title">
        待安排（{groups.length}）
        <span className="pool-hint">— 可拖曳至組槽，或把組槽上的組拖回此處</span>
      </div>
      <div className="pool-chips">
        {groups.length === 0 ? (
          <span className="pool-empty">全部已入座</span>
        ) : (
          groups.map((g) => <GroupChip key={g.id} group={g} />)
        )}
      </div>
    </div>
  );
}
