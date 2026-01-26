import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true, // React HMR mượt
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },

  /**
   * BẮT BUỘC cho Gemini API
   * Tránh lỗi: process is not defined (Vercel / Rollup)
   */
  define: {
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY || ""),
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
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("@google/genai")) return "vendor-ai";
            if (id.includes("firebase")) return "vendor-firebase";
            if (
              id.includes("lucide") ||
              id.includes("recharts")
            ) {
              return "vendor-ui";
            }
            return "vendor";
          }
        },
      },
    },

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
