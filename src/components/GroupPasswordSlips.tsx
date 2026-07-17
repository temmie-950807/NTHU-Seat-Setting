import { Fragment } from 'react';
import type { Group, RoomId } from '../types';
import {
  GROUP_ROOM_LAYOUTS,
  groupGridForRoom,
  type GroupSlot,
} from '../data/groupLayouts';
import { membersText } from '../lib/groups';

type Props = {
  enabledRooms: RoomId[];
  slotAssign: Record<string, string>;
  groupsById: Map<string, Group>;
};

function RoomGroupSlips({
  room,
  slotAssign,
  groupsById,
}: {
  room: RoomId;
  slotAssign: Record<string, string>;
  groupsById: Map<string, Group>;
}) {
  const layout = GROUP_ROOM_LAYOUTS[room];
  const grid = groupGridForRoom(room);
  const groupOf = (slot: GroupSlot): Group | null => {
    const gid = slotAssign[slot.anchorKey];
    return gid ? groupsById.get(gid) ?? null : null;
  };

  // 該室完全無分配則不印
  const hasAny = grid.lines.some((line) => line.some((slot) => groupOf(slot)));
  if (!hasAny) return null;

  return (
    <section className="slips-page">
      <h3 className="slips-title">
        {layout.name}　分組密碼紙（依座位相對位置排列，沿虛線裁切發給各組）
      </h3>
      <div className={`group-slips-layout ${grid.direction}`}>
        {grid.lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 &&
              grid.outerAisleAfter.has(li - 1) &&
              (grid.direction === 'horizontal' ? (
                <div className="gsl-aisle-row" aria-hidden />
              ) : (
                <div className="gsl-aisle-col" aria-hidden />
              ))}
            <div className={grid.direction === 'horizontal' ? 'gsl-line' : 'gsl-col'}>
              {line.map((slot, ii) => {
                const group = groupOf(slot);
                return (
                  <Fragment key={slot.anchorKey}>
                    {ii > 0 &&
                      grid.innerAisleAfter.has(ii - 1) &&
                      (grid.direction === 'horizontal' ? (
                        <div className="gsl-aisle-col" aria-hidden />
                      ) : (
                        <div className="gsl-aisle-row" aria-hidden />
                      ))}
                    {group ? (
                      <div className="group-slip">
                        <div className="gs-head">
                          <span className="gs-team">{group.account}</span>
                        </div>
                        <div className="gs-row">
                          <span className="gs-label">密碼</span>
                          <span className="gs-val mono">{group.password}</span>
                        </div>
                        <div className="gs-row">
                          <span className="gs-label">組員</span>
                          <span className="gs-val">
                            {membersText(group) || '(無成員)'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="group-slip group-slip-empty" aria-hidden />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default function GroupPasswordSlips({
  enabledRooms,
  slotAssign,
  groupsById,
}: Props) {
  if (enabledRooms.length === 0) {
    return <p className="empty">尚未啟用任何教室。</p>;
  }
  return (
    <div className="slips">
      {enabledRooms.map((room) => (
        <RoomGroupSlips
          key={room}
          room={room}
          slotAssign={slotAssign}
          groupsById={groupsById}
        />
      ))}
    </div>
  );
}
