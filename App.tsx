
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      // Bật Fast Refresh giúp việc phát triển cực nhanh mà không mất state
      fastRefresh: true,
      jsxRuntime: 'automatic',
    }),
  ],

  resolve: {
    alias: {
      // Alias @/ giúp code sạch hơn: import { X } from "@/components/X"
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Bảo mật: Chỉ nhúng API_KEY khi cần thiết
  define: {
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY ?? ""),
  },

  build: {
    outDir: "dist",
    target: "esnext", // Sử dụng các tính năng JS mới nhất để file nhỏ hơn
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false, // Tắt sourcemap ở production để bảo mật code

    rollupOptions: {
      output: {
        // Chiến thuật chia nhỏ code (Code Splitting) đỉnh cao
        // Giúp trình duyệt cache các thư viện ít thay đổi (React, Firebase)
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-core";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("@google/genai")) return "vendor-ai";
            if (id.includes("jszip")) return "vendor-utils";
            return "vendor-others";
          }
        },
        // Đặt tên file có hash để tránh cache cũ khi update
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Giới hạn chunk size cho project lớn (LMS thường nhiều file)
    chunkSizeWarningLimit: 2000,
  },

  // Tối ưu Esbuild: Xóa log ở production cho sạch và bảo mật
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },

  server: {
    port: 5173,
    strictPort: true, // Không tự đổi port nếu bận
    host: true, // Cho phép truy cập từ mạng LAN
  },
});
