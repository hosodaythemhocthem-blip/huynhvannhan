
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react()
  ],
  base: "./", // Quan trọng: Đảm bảo tương thích với sub-directory và HashRouter
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("@google/genai")) return "vendor-ai";
            if (id.includes("katex") || id.includes("pdfjs-dist")) return "vendor-math-pdf";
            return "vendor-common";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "lucide-react", "katex"],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
