import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  
  // Quan trọng: Dùng './' để chạy được cả trên máy local và khi deploy lên Vercel
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
    chunkSizeWarningLimit: 3000, 
    rollupOptions: {
      output: {
        // Cấu hình đơn giản hóa việc chia file để tránh lỗi 404 khi mạng chậm
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor"; // Gom hết thư viện vào 1 file cho ổn định
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
