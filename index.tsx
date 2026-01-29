import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 * - KHÔNG đặt Router ở đây
 * - KHÔNG init Firebase / AI ở đây
 * - App.tsx là nơi kiểm soát toàn bộ luồng
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy #root trong index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
