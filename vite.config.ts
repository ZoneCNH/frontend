import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.VITE_API_TARGET ?? 'http://84.247.154.45:8090'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/healthz': { target: API_TARGET, changeOrigin: true },
      '/readyz': { target: API_TARGET, changeOrigin: true },
      '/metrics': { target: API_TARGET, changeOrigin: true },
    },
  },
})
