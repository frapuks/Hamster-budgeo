import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Le front appelle /api/* en relatif : le proxy évite toute question de CORS,
    // en dev comme en prod (où le serveur sert lui-même les fichiers statiques).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
