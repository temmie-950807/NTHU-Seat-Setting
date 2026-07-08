import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// build 時使用 GitHub Pages 的子路徑（repo 名稱）；dev 維持根路徑。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/NTHU-Seat-Setting/' : '/',
  plugins: [react()],
}))
