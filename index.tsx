import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

// @ts-ignore: Bỏ qua kiểm tra type khắt khe của Vercel cho thư viện này
import * as pdfjsLib from "pdfjs-dist";

// Cấu hình Worker PDF.js từ URL CDN ổn định
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const mountApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Tắt loader khi React đã mount và bắt đầu render
    const hideLoader = () => {
      const loader = document.getElementById('system-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          if (loader.parentNode) loader.remove();
        }, 800);
      }
    };

    // Đảm bảo UI mượt mà trước khi gỡ loader
    requestAnimationFrame(() => {
      setTimeout(hideLoader, 600);
    });
    
    console.log("%c NHANLMS ELITE V5.9 %c BOOTED SUCCESSFULLY ", "color: white; background: #4f46e5; font-weight: 900; padding: 4px 10px; border-radius: 4px 0 0 4px;", "color: #4f46e5; background: #e0e7ff; font-weight: 900; padding: 4px 10px; border-radius: 0 4px 4px 0;");
  } catch (err) {
    console.error("Critical Boot Error:", err);
    const fallback = document.getElementById('fallback-error');
    if (fallback) fallback.style.display = 'flex';
  }
};

if (document.readyState === "complete" || document.readyState === "interactive") {
  mountApp();
} else {
  document.addEventListener("DOMContentLoaded", mountApp);
}
