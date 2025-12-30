
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
  // Chỉ define các giá trị cụ thể, tránh define toàn bộ process.env gây lỗi Rollup AST
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Sử dụng esbuild thay vì terser để tránh lỗi thiếu dependency
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
