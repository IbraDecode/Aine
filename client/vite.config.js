import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/settings': 'http://localhost:3000',
      '/images': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/download': 'http://localhost:3000',
      '/search': 'http://localhost:3000',
      '/tools': 'http://localhost:3000',
      '/random': 'http://localhost:3000',
      '/imagecreator': 'http://localhost:3000',
      '/orderkuota': 'http://localhost:3000',
    }
  }
})
