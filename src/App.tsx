import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { AppState, RoomId } from './types';
import {
  loadState,
  saveState,
  exportStateJson,
  parseStateJson,
} from './lib/storage';
import { parseRoster, buildStudents } from './lib/students';
import {
  assignSeats,
  placeStudent,
  toggleSeatDisabled,
  unseatedStudentIds,
} from './lib/assign';
import { generateUniquePasswords } from './lib/password';
import { ALL_ROOMS } from './data/roomLayouts';
import InputPanel from './components/InputPanel';
import SeatMap from './components/SeatMap';
import Pool from './components/Pool';
import PasswordTable from './components/PasswordTable';
import PasswordSlips from './components/PasswordSlips';
import './App.css';

type Tab = 'input' | 'seats' | 'passwords' | 'slips';

const TABS: { id: Tab; label: string }[] = [
  { id: 'input', label: '① 資料輸入' },
  { id: 'seats', label: '② 座位安排' },
  { id: 'passwords', label: '③ 密碼管理' },
  { id: 'slips', label: '④ 密碼紙' },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>('input');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const studentsById = useMemo(
    () => new Map(state.students.map((s) => [s.id, s] as const)),
    [state.students],
  );

  const unseated = useMemo(() => {
    const ids = new Set(unseatedStudentIds(state.students, state.seats));
    return state.students.filter((s) => ids.has(s.id));
  }, [state.students, state.seats]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // 套用名單：解析 → 建立學生（含密碼）→ 依現有座位設定隨機排座
  const applyRoster = (text: string) => {
    const students = buildStudents(parseRoster(text));
    setState((prev) => {
      const { seats } = assignSeats(
        students,
        prev.seats,
        prev.enabledRooms,
        prev.seed,
      );
      return { ...prev, students, seats };
    });
    setTab('seats');
  };

  const reshuffle = () => {
    setState((prev) => {
      const seed = prev.seed + 1;
      const { seats } = assignSeats(
        prev.students,
        prev.seats,
        prev.enabledRooms,
        seed,
      );
      return { ...prev, seed, seats };
    });
  };

  const toggleRoom = (room: RoomId) => {
    setState((prev) => {
      const has = prev.enabledRooms.includes(room);
      const enabledRooms = has
        ? prev.enabledRooms.filter((r) => r !== room)
        : ALL_ROOMS.filter((r) => prev.enabledRooms.includes(r) || r === room);
      // 停用教室：清掉該室座位上的人（退回待安排）
      const seats = has
        ? prev.seats.map((s) =>
            s.room === room ? { ...s, studentId: null } : s,
          )
        : prev.seats;
      return { ...prev, enabledRooms, seats };
    });
  };

  const onToggleSeatDisabled = (key: string) => {
    setState((prev) => ({
      ...prev,
      seats: toggleSeatDisabled(prev.seats, key),
    }));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    if (!activeId.startsWith('stu:')) return;
    const studentId = activeId.slice(4);
    const overId = e.over ? String(e.over.id) : null;
    let toKey: string | null = null;
    if (overId === 'pool') toKey = null;
    else if (overId?.startsWith('seat:')) toKey = overId.slice(5);
    else return; // 沒有有效落點
    setState((prev) => ({
      ...prev,
      seats: placeStudent(prev.seats, studentId, toKey),
    }));
  };

  const regenerateAll = () => {
    setState((prev) => {
      const pws = generateUniquePasswords(prev.students.length);
      return {
        ...prev,
        students: prev.students.map((s, i) => ({ ...s, password: pws[i] })),
      };
    });
  };

  const regenerateOne = (id: string) => {
    setState((prev) => {
      const existing = new Set(
        prev.students.filter((s) => s.id !== id).map((s) => s.password),
      );
      const [pw] = generateUniquePasswords(1, existing);
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id === id ? { ...s, password: pw } : s,
        ),
      };
    });
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setState(parseStateJson(String(reader.result ?? '')));
      } catch {
        alert('匯入失敗：檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const seatedCount = state.seats.filter((s) => s.studentId).length;

  return (
    <div className="app">
      <header className="app-header no-print">
        <h1>電腦教室座位 · 密碼產生器</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => exportStateJson(state)}
          >
            匯出設定
          </button>
          <label className="btn btn-sm">
            匯入設定
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importJson(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </header>

      <main className="app-main">
        {tab === 'input' && (
          <InputPanel
            enabledRooms={state.enabledRooms}
            studentCount={state.students.length}
            onToggleRoom={toggleRoom}
            onApplyRoster={applyRoster}
          />
        )}

        {tab === 'seats' && (
          <div className="seats-view">
            <div className="toolbar no-print">
              <span>
                已入座 <b>{seatedCount}</b> / 名單 <b>{state.students.length}</b>{' '}
                人
              </span>
              <button className="btn" type="button" onClick={reshuffle}>
                重新洗牌
              </button>
              <button
                className={'btn' + (editMode ? ' btn-primary' : '')}
                type="button"
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? '完成停用座位' : '停用座位模式'}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => window.print()}
              >
                列印座位表
              </button>
              {editMode && (
                <span className="warn">
                  點座位可切換「停用」；停用時佔位者退回待安排。
                </span>
              )}
            </div>

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              {!editMode && <Pool students={unseated} />}
              <div className="rooms">
                {state.enabledRooms.length === 0 ? (
                  <p className="empty">尚未啟用教室，請至「資料輸入」勾選。</p>
                ) : (
                  state.enabledRooms.map((room) => (
                    <SeatMap
                      key={room}
                      room={room}
                      seats={state.seats}
                      studentsById={studentsById}
                      editMode={editMode}
                      onToggleDisabled={onToggleSeatDisabled}
                    />
                  ))
                )}
              </div>
            </DndContext>
          </div>
        )}

        {tab === 'passwords' && (
          <PasswordTable
            students={state.students}
            onRegenerateOne={regenerateOne}
            onRegenerateAll={regenerateAll}
          />
        )}

        {tab === 'slips' && (
          <div className="slips-view">
            <div className="toolbar no-print">
              <span>密碼紙鏡射教室座位；沿虛線裁切、粗線為走道分隔。</span>
              <button
                className="btn"
                type="button"
                onClick={() => window.print()}
              >
                列印密碼紙
              </button>
            </div>
            <PasswordSlips
              enabledRooms={state.enabledRooms}
              seats={state.seats}
              studentsById={studentsById}
            />
          </div>
        )}
      </main>
    </div>
  );
}
