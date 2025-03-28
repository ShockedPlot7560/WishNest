import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('dev/localhost-key.pem'),
      cert: fs.readFileSync('dev/localhost.pem')
    }
  },
  plugins: [react(), VitePWA({ 
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    workbox: { globPatterns: ['**/*.{js,css,html,png,jpg,svg}'] },
    manifest: {
      name: 'WishNest',
      short_name: 'WishNest',
      start_url: '/',
      display: 'standalone',
      background_color: 'rgb(5, 7, 10)',
      theme_color: '#fff',
      icons: [
        {
          src: '/logo.webp',
          sizes: '563x563',
          type: 'image/webp'
        }
      ]
    }
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Divise les dépendances en chunks séparés
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
})
