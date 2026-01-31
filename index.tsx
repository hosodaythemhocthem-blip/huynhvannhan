import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 *
 * - KHÔNG đặt Router ở đây
 * - KHÔNG init Firebase / AI ở đây
 * - KHÔNG side-effect
 *
 * 👉 App.tsx kiểm soát toàn bộ luồng hệ thống
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy #root trong index.html");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* StrictMode chỉ dùng để detect bug khi DEV */}
    <App />
  </React.StrictMode>
);
