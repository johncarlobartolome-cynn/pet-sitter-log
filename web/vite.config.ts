import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL is required for a production build')
  }
  return { plugins: [react()] }
})
