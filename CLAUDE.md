# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

助教用的一站式**純前端**工具：座位安排、密碼產生、座位表列印、密碼紙列印。無後端、無任何網路請求；所有資料只存在瀏覽器 `localStorage` 與使用者主動下載的檔案。回覆與程式註解使用繁體中文。

## 常用指令

```bash
npm run dev      # 開發預覽（dev base = '/'）
npm run build    # tsc -b + vite build → dist/（會做型別檢查，改動後用此驗證）
npm run lint     # oxlint
npm run preview  # 預覽 build 產物
```

沒有測試框架。要驗證核心邏輯時，開一個 `*.mts` 用 `npx tsx` 直接匯入 `src/lib/*` 驗證即可（`lib/` 皆為純函式、無 React 依賴）。

## 架構重點

**單一狀態樹**：`App.tsx` 持有唯一的 `AppState`（`students / enabledRooms / seats / seed`，型別見 `src/types.ts`），四個分頁只是它的不同視圖。每次 `setState` 透過 `useEffect` 寫入 `localStorage`（`lib/storage.ts`）。

**資料驅動的教室版面** — 最重要的擴充點：`src/data/roomLayouts.ts` 用 `colGroups` / `rowGroups`（每個群組的座位／排數）定義 326、328 兩間教室；群組之間即「走道」。`SeatMap`（座位圖，走道為空隙）與 `PasswordSlips`（密碼紙，走道改為粗線）**共用**這份定義。要調整排數、分區或新增教室，改這裡即可，UI 會自動跟著變。

**座位與 localStorage 的校準**：座位以 key `${room}-${row}-${col}`（`seatKeyOf` / `keyOfSeat`）識別。載入舊資料時 `storage.ts` 的 `reconcileSeats` 會以目前版面為準重建座位、補齊新增的排、丟棄版面外的舊座，同時保留既有的 `disabled` 與 `studentId`。因此**改 `roomLayouts` 後不必清 localStorage**，舊存檔會自動長出新排。

**座位分配**（`lib/assign.ts`）：`frontFirstSeats` 收集啟用教室、未停用的座位並依「教室→前排→左欄」排序（前排優先＝近投影幕）；`seededShuffle`（`mulberry32`，用 `state.seed`）洗牌學生後依序填入，可重現。手動調整一律走 `placeStudent(seats, studentId, toKey)`：`toKey` 為座位 key＝放置／互換，為 `null`＝退回「待安排」區。

**拖拉（@dnd-kit）**：draggable id 為 `stu:<studentId>`，droppable 為 `seat:<seatKey>` 或 `pool`；解析集中在 `App.tsx` 的 `onDragEnd`。

**密碼**（`lib/password.ts`）：`SAFE_CHARS` 已排除易混淆字元 `0 O o 1 l I i`；`generateUniquePasswords` 保證全體互異。**改字集時**同步更新 README 的規則說明。

**列印**：靠 `App.css` 的 `@media print`；不想印出的元素加 `no-print` class（工具列、待安排區）。每次只渲染當前分頁，故 `window.print()` 只會印當前視圖。密碼紙用具名頁 `@page slips { size: A4 landscape }` 強制橫向。

## 部署（GitHub Pages）

`.github/workflows/deploy.yml`：push 到 `main` → build → 發佈到 Pages（來源已設為 GitHub Actions）。

⚠️ `vite.config.ts` 的 `base` 在 build 時為 `/NTHU-Seat-Setting/`（= repo 名）。**若 repo 改名，務必同步改 `base`**，否則線上版資源會 404 白畫面。dev 模式 base 維持 `/`。
