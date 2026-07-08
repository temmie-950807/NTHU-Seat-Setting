import { useRef, useState } from 'react';
import type { RoomId } from '../types';
import { ALL_ROOMS, ROOM_LAYOUTS, capacityOf } from '../data/roomLayouts';

type Props = {
  enabledRooms: RoomId[];
  studentCount: number;
  onToggleRoom: (room: RoomId) => void;
  onApplyRoster: (text: string) => void;
};

export default function InputPanel({
  enabledRooms,
  studentCount,
  onToggleRoom,
  onApplyRoster,
}: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const totalCapacity = enabledRooms
    .map((r) => capacityOf(ROOM_LAYOUTS[r]))
    .reduce((a, b) => a + b, 0);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="input-panel">
      <div className="panel-block">
        <h2>1. 貼上學生名單</h2>
        <p className="hint">
          每行一位，格式 <code>姓名,帳號</code>（可用逗號或 Tab 分隔）。
          帳號留空會自動補 <code>team01</code>、<code>team02</code>…。
          只填姓名亦可。
        </p>
        <textarea
          className="roster-input"
          rows={12}
          placeholder={'王小明,team01\n陳小華,\n林大同,s1234567'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row-actions">
          <button
            className="btn"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            上傳 CSV/文字檔
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            className="btn btn-primary"
            type="button"
            disabled={!text.trim()}
            onClick={() => onApplyRoster(text)}
          >
            產生密碼並排座
          </button>
        </div>
      </div>

      <div className="panel-block">
        <h2>2. 啟用教室</h2>
        <p className="hint">勾選這次要使用的教室；座位會盡量從前排開始安排。</p>
        <div className="room-toggles">
          {ALL_ROOMS.map((r) => {
            const layout = ROOM_LAYOUTS[r];
            const on = enabledRooms.includes(r);
            return (
              <label key={r} className={'room-toggle' + (on ? ' on' : '')}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggleRoom(r)}
                />
                <span>
                  {layout.name}（{capacityOf(layout)} 座）
                </span>
              </label>
            );
          })}
        </div>
        <p className="summary">
          目前名單 <b>{studentCount}</b> 人，啟用教室共 <b>{totalCapacity}</b> 座。
          {studentCount > totalCapacity && (
            <span className="warn">
              　⚠ 座位不足 {studentCount - totalCapacity} 席
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
