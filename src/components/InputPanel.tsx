import { useRef, useState } from 'react';
import type { Mode, RoomId } from '../types';
import { ALL_ROOMS, ROOM_LAYOUTS, capacityOf } from '../data/roomLayouts';
import { groupCapacityOf } from '../data/groupLayouts';

type Props = {
  mode: Mode;
  enabledRooms: RoomId[];
  count: number; // 個人＝學生數、分組＝組數
  onToggleRoom: (room: RoomId) => void;
  onApply: (text: string) => void;
};

export default function InputPanel({
  mode,
  enabledRooms,
  count,
  onToggleRoom,
  onApply,
}: Props) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isGroup = mode === 'group';
  const unit = isGroup ? '組' : '座';

  const totalCapacity = enabledRooms
    .map((r) => (isGroup ? groupCapacityOf(r) : capacityOf(ROOM_LAYOUTS[r])))
    .reduce((a, b) => a + b, 0);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="input-panel">
      <div className="panel-block">
        <h2>1. 貼上{isGroup ? '分組名單' : '學生名單'}</h2>
        {isGroup ? (
          <p className="hint">
            每行一組，格式 <code>姓名1,姓名2,姓名3,組名</code>
            （可用逗號或 Tab 分隔）。組名留空會自動補
            <code>第1組</code>、<code>第2組</code>…；人數可少於 3。
            每組共用一組帳密。
          </p>
        ) : (
          <p className="hint">
            每行一位，格式 <code>姓名,帳號</code>（可用逗號或 Tab 分隔）。
            帳號留空會自動補 <code>team01</code>、<code>team02</code>…。 只填姓名亦可。
          </p>
        )}
        <textarea
          className="roster-input"
          rows={12}
          placeholder={
            isGroup
              ? '王小明,李大華,陳美如,第一組\n張三,李四,王五\n趙六,錢七,,B隊'
              : '王小明,team01\n陳小華,\n林大同,s1234567'
          }
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
            onClick={() => onApply(text)}
          >
            產生密碼並{isGroup ? '排組' : '排座'}
          </button>
        </div>
      </div>

      <div className="panel-block">
        <h2>2. 啟用教室</h2>
        <p className="hint">
          勾選這次要使用的教室；{isGroup ? '各組' : '座位'}
          會盡量從靠講台的前排開始安排。
        </p>
        <div className="room-toggles">
          {ALL_ROOMS.map((r) => {
            const layout = ROOM_LAYOUTS[r];
            const cap = isGroup ? groupCapacityOf(r) : capacityOf(layout);
            const on = enabledRooms.includes(r);
            return (
              <label key={r} className={'room-toggle' + (on ? ' on' : '')}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggleRoom(r)}
                />
                <span>
                  {layout.name}（{cap} {unit}）
                </span>
              </label>
            );
          })}
        </div>
        <p className="summary">
          目前名單 <b>{count}</b> {unit}，啟用教室共 <b>{totalCapacity}</b> {unit}。
          {count > totalCapacity && (
            <span className="warn">
              　⚠ {unit}不足 {count - totalCapacity} {isGroup ? '組' : '席'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
