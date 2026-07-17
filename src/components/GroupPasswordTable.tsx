import type { Group } from '../types';
import { ALL_ROOMS } from '../data/roomLayouts';
import { GROUP_ROOM_LAYOUTS, groupSlotsForRoom } from '../data/groupLayouts';
import { exportGroupsCsv, type GroupCsvRow } from '../lib/csv';
import { membersText } from '../lib/groups';

type Props = {
  groups: Group[];
  slotAssign: Record<string, string>;
  onRegenerateOne: (id: string) => void;
  onRegenerateAll: () => void;
};

export default function GroupPasswordTable({
  groups,
  slotAssign,
  onRegenerateOne,
  onRegenerateAll,
}: Props) {
  // anchor → 位置資訊
  const anchorInfo = new Map<string, { roomName: string; label: string }>();
  for (const room of ALL_ROOMS) {
    const name = GROUP_ROOM_LAYOUTS[room].name;
    for (const slot of groupSlotsForRoom(room)) {
      anchorInfo.set(slot.anchorKey, { roomName: name, label: slot.label });
    }
  }
  // groupId → 位置
  const locById = new Map<string, { roomName: string; label: string }>();
  for (const [anchor, gid] of Object.entries(slotAssign)) {
    const info = anchorInfo.get(anchor);
    if (info) locById.set(gid, info);
  }

  const csvRows: GroupCsvRow[] = groups.map((g) => {
    const loc = locById.get(g.id);
    return {
      account: g.account,
      roomName: loc?.roomName ?? '',
      label: loc?.label ?? '',
      members: g.members,
      password: g.password,
    };
  });

  return (
    <div className="password-table-wrap">
      <div className="row-actions no-print">
        <button
          className="btn"
          type="button"
          disabled={groups.length === 0}
          onClick={onRegenerateAll}
        >
          全部重新產生
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={groups.length === 0}
          onClick={() => exportGroupsCsv(csvRows)}
        >
          匯出 groups.csv
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="empty">尚無組別，請先於「資料輸入」貼上名單。</p>
      ) : (
        <table className="password-table">
          <thead>
            <tr>
              <th>#</th>
              <th>組名</th>
              <th>座位</th>
              <th>組員</th>
              <th>密碼</th>
              <th className="no-print">操作</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => {
              const loc = locById.get(g.id);
              return (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td>{g.account}</td>
                  <td>
                    {loc ? (
                      `${loc.roomName} ${loc.label}`
                    ) : (
                      <span className="muted">未安排</span>
                    )}
                  </td>
                  <td>
                    {membersText(g) || <span className="muted">(無成員)</span>}
                  </td>
                  <td className="mono">{g.password}</td>
                  <td className="no-print">
                    <button
                      className="btn btn-sm"
                      type="button"
                      onClick={() => onRegenerateOne(g.id)}
                    >
                      重產
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
