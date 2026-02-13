import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": __dirname, // Alias về root để không lỗi nếu không có src
    },
  },

  build: {
    outDir: "dist",
    target: "es2018",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    emptyOutDir: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;

          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("pdfjs")) return "vendor-pdf";
            if (id.includes("mammoth")) return "vendor-docx";
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },

  preview: {
    port: 4173,
    host: true,
  },
});
