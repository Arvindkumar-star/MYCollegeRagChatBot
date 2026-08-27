import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Auth & chat API routes → backend
      '/auth': { target: 'http://localhost:5000', changeOrigin: true },
      '/chat': { target: 'http://localhost:5000', changeOrigin: true },
      '/conversations': { target: 'http://localhost:5000', changeOrigin: true },
      '/messages': { target: 'http://localhost:5000', changeOrigin: true },
      '/suggested-questions': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/health': { target: 'http://localhost:5000', changeOrigin: true },
      // Admin API: match /admin/anything (but not bare /admin which is the React page)
      '^/admin/.+': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
