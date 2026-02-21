import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  
  // Quan trọng: Dùng './' để chạy được cả trên máy local và khi deploy
  base: './', 

  resolve: {
    alias: {
      // Dấu @ sẽ trỏ thẳng vào thư mục chứa file vite.config.ts này (thư mục gốc)
      "@": path.resolve(__dirname, "."), 
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 3000, // Tăng giới hạn để không báo vàng
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Tách nhỏ các thư viện để load nhanh hơn, tránh lỗi quá tải
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("katex")) return "vendor-math";
            return "vendor-libs";
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    host: true, // Cho phép truy cập qua IP mạng LAN
  },
})
