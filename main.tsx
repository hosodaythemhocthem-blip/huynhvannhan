import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 * - StrictMode: bắt lỗi lifecycle & side-effect sớm
 * - Không xử lý business logic tại đây
 * - Mọi API / AI / Firebase đều nằm ở services
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy phần tử #root trong index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
