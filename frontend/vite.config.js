import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/signup': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/reservations': 'http://localhost:5000',
      '/tables': 'http://localhost:5000',
      '/cancelled-reservations': 'http://localhost:5000',
    }
  }
})