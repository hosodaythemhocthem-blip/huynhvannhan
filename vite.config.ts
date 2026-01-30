import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Chuẩn ES module (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
    }),
  ],

  // Alias gọn cho toàn project
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  /**
   * Fix process.env cho:
   * - @google/genai
   * - Firebase
   * - Deploy Vercel
   */
  define: {
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY ?? ""),
  },

  build: {
    outDir: "dist",
    target: "es2018",
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react")) return "vendor-react";
          if (id.includes("firebase")) return "vendor-firebase";
          if (id.includes("@google/genai")) return "vendor-ai";
          if (id.includes("lucide") || id.includes("recharts"))
            return "vendor-ui";

          return "vendor";
        },
      },
    },

    // Giảm cảnh báo chunk cho LMS lớn
    chunkSizeWarningLimit: 1500,
  },

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
