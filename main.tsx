import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 *
 * Nguyên tắc:
 * - Chỉ render App
 * - Không chứa business logic
 * - Không init Firebase / AI / API
 * - StrictMode để bắt lỗi lifecycle & side-effect sớm (DEV)
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy phần tử #root trong index.html");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
