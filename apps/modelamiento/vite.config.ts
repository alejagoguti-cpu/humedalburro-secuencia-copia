import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Se compila a /modelamiento (junto al resto de páginas de GitHub Pages) con rutas relativas.
export default defineConfig({
  base: './',
  optimizeDeps: { exclude: ['maplibre-gl'] },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../../modelamiento', emptyOutDir: true, chunkSizeWarningLimit: 1500,
    rollupOptions: { input: { main: 'index.html', conclusion: 'conclusion.html' } },
  },
});
