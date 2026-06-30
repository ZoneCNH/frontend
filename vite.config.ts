import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1/market': 'http://jp1.internal:8090',
      '/healthz': 'http://jp1.internal:8090',
      '/readyz': 'http://jp1.internal:8090',
      '/metrics': 'http://jp1.internal:8090',
    },
  },
})
