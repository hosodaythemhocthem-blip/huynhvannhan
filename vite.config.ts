
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Sử dụng fallback chuỗi rỗng để tránh lỗi AST parsing của Rollup
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ai': ['@google/genai'],
          'vendor-ui': ['lucide-react', 'recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
