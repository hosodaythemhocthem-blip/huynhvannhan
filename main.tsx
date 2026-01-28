import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 Root duy nhất cho toàn bộ LMS
 * - Giữ StrictMode để bắt lỗi sớm
 * - Mọi side-effect được khóa ở tầng service
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy #root – kiểm tra index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
