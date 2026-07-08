import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      name: 'PathikReact',
      formats: ['iife'],
      fileName: () => 'pathik-react.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: 'pathik-react.[ext]',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
