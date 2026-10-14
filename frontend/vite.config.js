import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devApi } from './dev/api-plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose every var (not just VITE_*) to the dev API handlers, like Vercel does.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), tailwindcss(), devApi()],
  }
})
