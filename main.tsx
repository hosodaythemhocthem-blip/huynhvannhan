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
 * - Không init Supabase / API
 * - StrictMode để bắt lỗi lifecycle & side-effect sớm (DEV)
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy phần tử #root trong index.html");
}

// 🔥 Bọc thêm Error Boundary nhẹ để tránh trắng trang
const RootApp = () => {
  try {
    return <App />;
  } catch (error) {
    console.error("Lỗi render App:", error);
    return (
      <div style={{ padding: 40 }}>
        <h1>LMS gặp lỗi render ⚠</h1>
        <p>Kiểm tra console để xem chi tiết.</p>
      </div>
    );
  }
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
