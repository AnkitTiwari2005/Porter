import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API || 'http://localhost:4000',
        changeOrigin: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  test: {
    include: ['src/**/*.test.{js,jsx}', 'shared/**/*.test.js'],
    environment: 'node'
  }
});
