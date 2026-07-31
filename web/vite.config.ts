import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hamsterbudgeo/shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
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
  // Même relais pour `npm run preview`, qui sert la version compilée : c'est le seul
  // moyen de tester le service worker, inactif en développement.
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
