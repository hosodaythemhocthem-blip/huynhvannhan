import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 * Cấu trúc thư mục đã được xác nhận theo sơ đồ Components, Pages, Services, Types.
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy phần tử #root trong index.html");
}

// Sử dụng React.StrictMode để phát hiện các vấn đề tiềm ẩn trong quá trình phát triển
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
