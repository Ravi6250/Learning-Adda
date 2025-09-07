import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is your existing proxy configuration. Leave it as is.
    proxy: {
      '/api': {
        target: 'http://localhost:3300',
        changeOrigin: true,
        secure: false,
      },
    },
    // --- ADD THIS ONE LINE ---
    port: 5174,
    // -----------------------
  },
})