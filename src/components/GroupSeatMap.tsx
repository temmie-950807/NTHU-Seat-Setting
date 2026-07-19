import { Fragment } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Group, RoomId } from '../types';
import {
  GROUP_ROOM_LAYOUTS,
  groupGridForRoom,
  type GroupSlot,
} from '../data/groupLayouts';

type Props = {
  room: RoomId;
  slotAssign: Record<string, string>;
  groupsById: Map<string, Group>;
};

function GroupBox({
  slot,
  group,
  direction,
}: {
  slot: GroupSlot;
  group: Group | null;
  direction: 'horizontal' | 'vertical';
}) {
  // 整個組矩形是一個落點；已有組時整組可拖（移動／互換）
  const drop = useDroppable({ id: `slot:${slot.anchorKey}` });
  const canDrag = !!group;
  const drag = useDraggable({
    id: canDrag ? `grp:${group!.id}` : `grp:__slot_${slot.anchorKey}`,
    disabled: !canDrag,
  });
  const setRef = (node: HTMLElement | null) => {
    drop.setNodeRef(node);
    if (canDrag) drag.setNodeRef(node);
  };

  const cls = ['grp-box', direction];
  if (group) cls.push('filled');
  if (drop.isOver) cls.push('over');
  const dragProps = canDrag
    ? {
        ...drag.listeners,
        ...drag.attributes,
        style: { opacity: drag.isDragging ? 0.4 : 1 },
      }
    : {};

  return (
    <div ref={setRef} className={cls.join(' ')} {...dragProps}>
      {group && <span className="grp-box-tag">{group.account}</span>}
      {slot.seatKeys.map((sk, idx) => {
        const [, row, col] = sk.split('-');
        const name = group ? group.members[idx] ?? '' : '';
        return (
          <div key={sk} className="grp-cell" data-seat={sk}>
            {group ? (
              <span className="chip-name">{name || '—'}</span>
            ) : (
              <span className="seat-pos">{`R${row}C${col}`}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function GroupSeatMap({ room, slotAssign, groupsById }: Props) {
  const layout = GROUP_ROOM_LAYOUTS[room];
  const grid = groupGridForRoom(room);
  const groupOf = (slot: GroupSlot): Group | null => {
    const gid = slotAssign[slot.anchorKey];
    return gid ? groupsById.get(gid) ?? null : null;
  };

  return (
    <section className={`room group-room room-${room}`}>
      <h2 className="room-name">{layout.name}</h2>
      <div className="screen">[ 投影幕 ]</div>
      <div className={`group-room-grid ${grid.direction}`}>
        {grid.lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 &&
              grid.outerAisleAfter.has(li - 1) &&
              (grid.direction === 'horizontal' ? (
                <div className="grp-aisle-row" aria-hidden />
              ) : (
                <div className="grp-aisle-col" aria-hidden />
              ))}
            <div className={grid.direction === 'horizontal' ? 'grp-line' : 'grp-col'}>
              {line.map((slot, ii) => (
                <Fragment key={slot.anchorKey}>
                  {ii > 0 &&
                    grid.innerAisleAfter.has(ii - 1) &&
                    (grid.direction === 'horizontal' ? (
                      layout.gapDesk ? (
                        <div className="grp-desk-unused">
                          <span className="seat-pos">未使用</span>
                        </div>
                      ) : (
                        <div className="grp-aisle-col" aria-hidden />
                      )
                    ) : (
                      <div className="grp-aisle-row" aria-hidden />
                    ))}
                  <GroupBox
                    slot={slot}
                    group={groupOf(slot)}
                    direction={grid.direction}
                  />
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
