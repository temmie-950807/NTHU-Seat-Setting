import type { Student } from '../types';
import { exportPasswordsCsv } from '../lib/csv';

type Props = {
  students: Student[];
  onRegenerateOne: (id: string) => void;
  onRegenerateAll: () => void;
};

export default function PasswordTable({
  students,
  onRegenerateOne,
  onRegenerateAll,
}: Props) {
  return (
    <div className="password-table-wrap">
      <div className="row-actions no-print">
        <button
          className="btn"
          type="button"
          disabled={students.length === 0}
          onClick={onRegenerateAll}
        >
          全部重新產生
        </button>
        <button
          className="btn btn-primary"
          type="button"
          disabled={students.length === 0}
          onClick={() => exportPasswordsCsv(students)}
        >
          匯出 passwords.csv
        </button>
      </div>

      {students.length === 0 ? (
        <p className="empty">尚無學生，請先於「資料輸入」貼上名單。</p>
      ) : (
        <table className="password-table">
          <thead>
            <tr>
              <th>#</th>
              <th>姓名</th>
              <th>帳號</th>
              <th>密碼</th>
              <th className="no-print">操作</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>{s.name || <span className="muted">(無姓名)</span>}</td>
                <td>{s.account}</td>
                <td className="mono">{s.password}</td>
                <td className="no-print">
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => onRegenerateOne(s.id)}
                  >
                    重產
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
