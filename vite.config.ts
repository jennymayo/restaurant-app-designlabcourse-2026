import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Two plugins: React (JSX support) and Tailwind (our styling system).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
