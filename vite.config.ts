import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: "automatic",
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return;
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-core";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("@google/genai")) return "vendor-ai";
            if (id.includes("jszip")) return "vendor-utils";
            return "vendor-others";
          }
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },

    chunkSizeWarningLimit: 2000,
  },

  esbuild: {
    drop:
      process.env.NODE_ENV === "production"
        ? ["console", "debugger"]
        : [],
    legalComments: "none",
  },

  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
